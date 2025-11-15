/*
/// Module: sui1_community
module sui1_community::sui1_community;
*/

// For Move coding conventions, see
// https://docs.sui.io/concepts/sui-move-concepts/conventions

module sui1_community::sui1_community {
  use std::string;
  use sui::display;
  use sui::package;

  // Validation error codes.
  const E_EMPTY_NAME: u64 = 1;
  const E_EMPTY_IMAGE: u64 = 2;

  // One-time witness for claiming Publisher during Display initialization.
  public struct SUI1_COMMUNITY has drop {}

  // NTF being minted.
  // - `key` ability: Indicates that it is an object with a unique ID on the Sui ledger.
  // - `store` ability: Allows it to be moved (transferred) to other modules.
  public struct Sui1CommunityNFT has key, store {
      id: object::UID,          // Unique ID managed by Sui (required)
      name: string::String,     // Display name
      description: string::String, // Description
      image_url: string::String,// Image URL (IPFS, HTTPS, etc.)
      creator: address,         // Creator (sender at minting time)
  }

  // Entry point to mint an NFT to the wallet sender.
  // - Validates the received `name`/`description`/`image_url` and mints
  // - Transfers the created NFT object to the sender
  entry fun mint(
      name: string::String,
      description: string::String,
      image_url: string::String,
      ctx: &mut tx_context::TxContext,
  ) {
      let sender = tx_context::sender(ctx);
      let nft = mint_internal(sender, name, description, image_url, ctx);
      // Because it has the `store` ability, it can be safely transferred from anywhere.
      transfer::public_transfer(nft, sender);
  }

  // Actual minting process (logic part).
  // - Simple input validation
  // - Assigns a new object ID with `object::new(ctx)`
  // - Fills the fields and returns `Sui1CommunityNFT`
  fun mint_internal(
      sender: address,
      name: string::String,
      description: string::String,
      image_url: string::String,
      ctx: &mut tx_context::TxContext,
  ): Sui1CommunityNFT {
      assert!(!string::is_empty(&name), E_EMPTY_NAME);
      assert!(!string::is_empty(&image_url), E_EMPTY_IMAGE);

      Sui1CommunityNFT {
          id: object::new(ctx),
          name,
          description,
          image_url,
          creator: sender,
      }
  }

  // Metadata retrieval (useful for UI display, etc.).
  public fun metadata(nft: &Sui1CommunityNFT): (string::String, string::String, string::String) {
      (copy nft.name, copy nft.description, copy nft.image_url)
  }

  // Creator (the address of the sender at minting time).
  public fun creator(nft: &Sui1CommunityNFT): address {
      nft.creator
  }

  // Initialization logic to create and share Display when the package is published.
  // Sui's initializer only requires defining `fun init(...)` within the module (no attributes needed).
  fun init(witness: SUI1_COMMUNITY, ctx: &mut tx_context::TxContext) {
      // Obtain the Publisher (needed for Display registration)
      let publisher = package::claim(witness, ctx);

      // Register field templates used for display
      let mut disp = display::new_with_fields<Sui1CommunityNFT>(
          &publisher,
          vector[
              string::utf8(b"name"),
              string::utf8(b"description"),
              string::utf8(b"image_url"),
              string::utf8(b"link"),
          ],
          vector[
              string::utf8(b"{name}"),
              string::utf8(b"{description}"),
              string::utf8(b"{image_url}"),
              string::utf8(b"{image_url}"),
          ],
          ctx,
      );

      // Advance the version of Display to activate it and transfer to the creator
      display::update_version(&mut disp);
      transfer::public_transfer(disp, tx_context::sender(ctx));

      // Return the Publisher to the issuer (often want to keep it)
      transfer::public_transfer(publisher, tx_context::sender(ctx));
  }
}

