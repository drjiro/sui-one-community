/*
/// Module: dao
module dao::dao;
*/
module {{sender}}::dao {

    use std::vector;
    use std::option;
    use sui::object::UID;
    use sui::tx_context::{TxContext, sender};
    use sui::transfer;

    use {{sender}}::membership::MembershipNFT;

    struct Proposal has store {
        id: u64,
        title: vector<u8>,
        yes: u64,
        no: u64,
        executed: bool,
        approved_by_player: bool,
        voters: vector<address>,
    }

    struct FanDao has key {
        id: UID,
        player: address,              // ← 選手のウォレット
        yes_threshold: u64,           // 可決ライン
        proposals: vector<Proposal>,
        next_id: u64,
    }

    /// DAO 作成（選手の address を登録）
    public entry fun create(
        player: address,
        yes_threshold: u64,
        ctx: &mut TxContext
    ) {
        let dao = FanDao {
            id: UID::new(ctx),
            player,
            yes_threshold,
            proposals: vector::empty<Proposal>(),
            next_id: 0,
        };
        transfer::share_object(dao);
    }

    /// サポーター判定（※簡易例）
    fun is_supporter(_addr: address): bool {
        // 実際には indexer / dynamic fields で NFT 所有チェックをする
        true
    }

    /// 提案作成（サポーターのみ）
    public entry fun new_proposal(
        dao: &mut FanDao,
        title: vector<u8>,
        ctx: &TxContext
    ) {
        let s = sender(ctx);
        assert!(is_supporter(s), 1);

        let id = dao.next_id;
        dao.next_id = id + 1;

        let p = Proposal {
            id,
            title,
            yes: 0,
            no: 0,
            executed: false,
            approved_by_player: false,
            voters: vector::empty<address>(),
        };

        vector::push_back(&mut dao.proposals, p);
    }

    /// 投票（サポーターのみ）
    public entry fun vote(
        dao: &mut FanDao,
        id: u64,
        yes: bool,
        ctx: &TxContext
    ) {
        let voter = sender(ctx);
        assert!(is_supporter(voter), 2);

        let i = option::extract(find(&dao.proposals, id));
        let p = &mut vector::borrow_mut(&mut dao.proposals, i);

        assert!(!p.executed, 3);

        vector::push_back(&mut p.voters, voter);

        if (yes) { p.yes = p.yes + 1; }
        else     { p.no  = p.no  + 1; }
    }

    /// 選手本人が承認（YESがthreshold以上でのみ承認可）
    public entry fun approve_execution(
        dao: &mut FanDao,
        id: u64,
        ctx: &TxContext
    ) {
        let signer = sender(ctx);
        assert!(signer == dao.player, 4);   // ← 選手のみ

        let i = option::extract(find(&dao.proposals, id));
        let p = &mut vector::borrow_mut(&mut dao.proposals, i);

        assert!(p.yes >= dao.yes_threshold, 5);

        p.approved_by_player = true;
    }

    /// 実行（サポーター or 選手、誰でも可）
    public entry fun execute(
        dao: &mut FanDao,
        id: u64,
        ctx: &TxContext
    ) {
        let i = option::extract(find(&dao.proposals, id));
        let p = &mut vector::borrow_mut(&mut dao.proposals, i);

        assert!(p.approved_by_player, 6);

        p.executed = true;

        // 実行アクションはここに追加（例：トレジャリーから送金など）
    }

    fun find(vec: &vector<Proposal>, id: u64): option::Option<u64> {
        let len = vector::length(vec);
        let mut i = 0;
        while (i < len) {
            let p = vector::borrow(vec, i);
            if (p.id == id) return option::some(i);
            i = i + 1;
        }
        option::none()
    }
}