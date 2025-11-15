import { client } from "./sui";
import { MEMBERSHIP_IMAGE } from "./nftUrl";

export interface NFTItem {
  id: string;
  type: string;
  number: number;
  imageUrl: string;
}

export async function fetchOwnedNFTs(owner: string): Promise<NFTItem[]> {
  const objects = await client.getOwnedObjects({
    owner,
    options: {
      showContent: true,
    }
  });

  const nfts: NFTItem[] = [];

  for (const o of objects.data) {
    if (!o.data || o.data.content?.dataType !== "moveObject") continue;

    const type = o.data.content.type;
    const fields = o.data.content.fields as any;

    // -------------------------
    // Membership NFT 判定
    // type: <pkg>::fan_dao::MembershipNFT
    // -------------------------
    if (type.includes("::fan_dao::MembershipNFT")) {
      const number = fields.number;

      // ※ 画像 URL は好きに決めてよい
      const imageUrl = MEMBERSHIP_IMAGE;

      nfts.push({
        id: o.data.objectId,
        type,
        number,
        imageUrl,
      });

      continue;
    }

    // -------------------------
    // Event NFT 判定
    // type: <pkg>::fan_dao::EventNFT
    // -------------------------
    if (type.includes("::fan_dao::EventNFT")) {
      const uri = fields.uri;

      nfts.push({
        id: o.data.objectId,
        type,
        number: 0,
        imageUrl: uri,  // そのまま画像 URL として使用
      });
      continue;
    }
  }

  return nfts;
}