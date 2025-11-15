/*
/// Module: membership
module membership::membership;
*/

module {{sender}}::membership {

    use sui::object::UID;
    use sui::tx_context::TxContext;
    use sui::transfer;

    struct MembershipNFT has key, store {
        id: UID,
        name: vector<u8>,
    }

    public entry fun mint_to(
        name: vector<u8>,
        recipient: address,
        ctx: &mut TxContext
    ) {
        let nft = MembershipNFT {
            id: UID::new(ctx),
            name,
        };
        transfer::transfer(nft, recipient);
    }
}