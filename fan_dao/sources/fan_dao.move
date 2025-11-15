module fan_dao::fan_dao {
    use sui::sui::SUI;
    use sui::coin::{Self, Coin};
    use sui::balance;
    use std::string::{Self, String};

    /// Error codes
    const ENotEnoughPayment: u64 = 0;
    const EMaxMembershipReached: u64 = 1;
    const EProposalNotFound: u64 = 2;
    const ENotPlayer: u64 = 3;
    const ENotApprovedByPlayer: u64 = 4;
    const ENotExecuted: u64 = 5;
    const ESaleNotOpen: u64 = 6;

    /// Membership NFT (fan card)
    public struct MembershipNFT has key, store {
      id: UID,
      number: u64,
      uri: String,
    }

    /// Event NFT (ticket / commemorative NFT)
    public struct EventNFT has key, store {
      id: UID,
      event_id: u64,
      uri: String,
    }

    /// Simple proposal object
    public struct Proposal has store {
      id: u64,
      title: String,
      description: String,
      event_uri: String,
      event_price: u64,
      yes_votes: u64,
      no_votes: u64,
      executed: bool,            // true when community threshold is reached
      approved_by_player: bool,  // true when the player approved
      sale_open: bool,           // true when Event NFT sale is open
    }

    /// Main DAO shared object
    public struct FanDao has key, store {
      id: UID,

      /// Player (athlete) address
      player: address,

      /// Membership settings
      membership_price: u64,
      max_memberships: u64,
      sold_memberships: u64,

      /// YES votes required to mark a proposal as executed
      yes_threshold: u64,

      /// DAO treasury (SUI balance)
      treasury: balance::Balance<SUI>,

      /// Proposals
      proposals: vector<Proposal>,
      next_proposal_id: u64,
    }

    /// Create and share a new FanDao.
    /// This function should be called once from the deployer wallet.
    public fun create(
      player: address,
      membership_price: u64,
      max_memberships: u64,
      yes_threshold: u64,
      ctx: &mut TxContext,
    ) {
      let dao = FanDao {
        id: object::new(ctx),
        player,
        membership_price,
        max_memberships,
        sold_memberships: 0,
        yes_threshold,
        treasury: balance::zero<SUI>(),
        proposals: vector::empty<Proposal>(),
        next_proposal_id: 0,
      };

      // ✅ 新: public_share_object を使う
      transfer::public_share_object(dao);
    }

    /// Buy a membership NFT.
    /// `payment` is a mutable reference to the caller's Coin<SUI>.
    /// The function reduces the coin balance and deposits SUI into the DAO treasury.
    public fun buy_membership(
      dao: &mut FanDao,
      payment: Coin<SUI>,
      ctx: &mut TxContext,
    ) {
      assert!(dao.sold_memberships < dao.max_memberships, EMaxMembershipReached);
      assert!(coin::value(&payment) >= dao.membership_price, ENotEnoughPayment);

      //
      // 1. Convert coin to balance
      //
      let mut bal = coin::into_balance(payment);

      //
      // 2. Split required amount
      //
      let pay_amount = balance::split(&mut bal, dao.membership_price);

      //
      // 3. Move pay_amount to treasury
      //
      balance::join(&mut dao.treasury, pay_amount);

      let uri = string::utf8(
          b"https://raw.githubusercontent.com/drjiro/sui-one-community/main/assets/membership.png"
      );

      //
      // 4. Return change to sender
      //
      let change = coin::from_balance(bal, ctx);
      transfer::public_transfer(change, tx_context::sender(ctx));

      // 5. Mint membership NFT for the buyer
      let nft = MembershipNFT {
        id: object::new(ctx),
        number: dao.sold_memberships,
        uri
      };
      dao.sold_memberships = dao.sold_memberships + 1;

      // ✅ public_transfer を使う
      transfer::public_transfer(nft, tx_context::sender(ctx));
    }

    /// Create a new event proposal.
    /// Only membership holders can call this function (checked via MembershipNFT parameter).
    public fun new_event_proposal(
      dao: &mut FanDao,
      _member: &MembershipNFT,
      title: String,
      description: String,
      event_uri: String,
      event_price: u64,
      ctx: &mut TxContext,
    ) {
      let id = dao.next_proposal_id;
      dao.next_proposal_id = id + 1;

      let p = Proposal {
        id,
        title,
        description,
        event_uri,
        event_price,
        yes_votes: 0,
        no_votes: 0,
        executed: false,
        approved_by_player: false,
        sale_open: false,
      };

      vector::push_back(&mut dao.proposals, p);
    }

    /// Vote on a proposal.
    /// Only membership holders can vote (checked via MembershipNFT parameter).
    public fun vote(
      dao: &mut FanDao,
      _member: &MembershipNFT,
      proposal_id: u64,
      yes: bool,
    ) {
      let len = vector::length(&dao.proposals);
      let mut i = 0;

      while (i < len) {
          let p_ref = vector::borrow_mut(&mut dao.proposals, i);
          if (p_ref.id == proposal_id) {
              if (yes) {
                  p_ref.yes_votes = p_ref.yes_votes + 1;
              } else {
                  p_ref.no_votes = p_ref.no_votes + 1;
              };

              // When enough YES votes, mark as executed (community approval)
              if (!p_ref.executed && p_ref.yes_votes >= dao.yes_threshold) {
                  p_ref.executed = true;
              };
              return
          };
          i = i + 1;
      };

      // Proposal not found
      abort EProposalNotFound;
    }

    /// Player (athlete) approves an already executed proposal.
    /// This is a soft "multi-sig" step between the DAO and the player.
    public fun approve_by_player(
      dao: &mut FanDao,
      proposal_id: u64,
      ctx: &mut TxContext,
    ) {
      let sender = tx_context::sender(ctx);
      assert!(sender == dao.player, ENotPlayer);

      let len = vector::length(&dao.proposals);
      let mut i = 0;

      while (i < len) {
        let p_ref = vector::borrow_mut(&mut dao.proposals, i);
        if (p_ref.id == proposal_id) {
          // Must be executed by community first
          assert!(p_ref.executed, ENotExecuted);
          p_ref.approved_by_player = true;
          return
        };
        i = i + 1;
      };

      abort EProposalNotFound;
    }

    /// Open Event NFT sale for an approved proposal.
    /// After this call, fans can buy Event NFTs via `buy_event_nft`.
    public fun execute_event(
      dao: &mut FanDao,
      proposal_id: u64,
    ) {
      let len = vector::length(&dao.proposals);
      let mut i = 0;

      while (i < len) {
        let p_ref = vector::borrow_mut(&mut dao.proposals, i);
        if (p_ref.id == proposal_id) {
          // Must be executed (community) and approved by player
          assert!(p_ref.executed, ENotExecuted);
          assert!(p_ref.approved_by_player, ENotApprovedByPlayer);
          p_ref.sale_open = true;
          return
        };
        i = i + 1;
      };

      abort EProposalNotFound;
    }

    /// Buy an Event NFT after sale is open.
    /// `payment` is a mutable reference to the buyer's Coin<SUI>.
    public fun buy_event_nft(
      dao: &mut FanDao,
      payment: &mut Coin<SUI>,
      proposal_id: u64,
      ctx: &mut TxContext,
    ) {
      let len = vector::length(&dao.proposals);
      let mut i = 0;

      while (i < len) {
        let p_ref = vector::borrow_mut(&mut dao.proposals, i);
        if (p_ref.id == proposal_id) {
          assert!(p_ref.sale_open, ESaleNotOpen);
          assert!(coin::value(payment) >= p_ref.event_price, ENotEnoughPayment);

          // Move SUI from user coin into DAO treasury
          let pay_balance = coin::balance_mut(payment);
          let paid = balance::split(pay_balance, p_ref.event_price);
          balance::join(&mut dao.treasury, paid);

          // Mint Event NFT and transfer to buyer
          let nft = EventNFT {
            id: object::new(ctx),
            event_id: proposal_id,
            uri: p_ref.event_uri,
          };
          // ✅ ここも public_transfer
          transfer::public_transfer(nft, tx_context::sender(ctx));
          return
        };
        i = i + 1;
      };

      abort EProposalNotFound;
    }
}