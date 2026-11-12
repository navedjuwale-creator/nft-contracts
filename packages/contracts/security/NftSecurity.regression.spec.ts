import {Cell, CellMessage, CommonMessageInfo, InternalMessage, toNano} from "ton";
import {randomAddress} from "../../utils/randomAddress";
import {NftItemData, Queries as ItemQueries} from "../nft-item/NftItem.data";
import {NftItemLocal} from "../nft-item/NftItemLocal";
import {NftCollectionData} from "../nft-collection/NftCollection.data";
import {NftCollectionLocal} from "../nft-collection/NftCollectionLocal";

const OWNER = randomAddress();
const COLLECTION = randomAddress();

const itemConfig: NftItemData = {
    index: 7,
    collectionAddress: COLLECTION,
    ownerAddress: OWNER,
    content: "security-regression"
};

const collectionConfig: NftCollectionData = {
    ownerAddress: OWNER,
    nextItemIndex: 0,
    collectionContent: "collection",
    commonContent: "item/",
    nftItemCode: new Cell(),
    royaltyParams: {
        royaltyFactor: 100,
        royaltyBase: 200,
        royaltyAddress: randomAddress()
    }
};

describe("NFT security regression tests", () => {
    it("rejects an ownership transfer initiated by a non-owner and preserves ownership", async () => {
        const nft = await NftItemLocal.createFromConfig(itemConfig);
        const attacker = randomAddress();

        const result = await nft.contract.sendInternalMessage(new InternalMessage({
            to: nft.address,
            from: attacker,
            value: toNano(1),
            bounce: false,
            body: new CommonMessageInfo({
                body: new CellMessage(ItemQueries.transfer({
                    newOwner: randomAddress(),
                    forwardAmount: toNano("0.01"),
                    responseTo: null
                }))
            })
        }));

        expect(result.exit_code).not.toEqual(0);
        const data = await nft.getNftData();
        expect(data.isInitialized).toBe(true);
        if (data.isInitialized) {
            expect(data.ownerAddress.toFriendly()).toEqual(OWNER.toFriendly());
        }
    });

    it("rejects collection batch minting by a non-owner", async () => {
        const collection = await NftCollectionLocal.createFromConfig(collectionConfig);
        const attacker = randomAddress();

        const result = await collection.sendBatchDeployNft(attacker, toNano(1), {
            items: [{
                passAmount: toNano("0.2"),
                index: 0,
                ownerAddress: randomAddress(),
                content: "unauthorized"
            }]
        });

        expect(result.exit_code).not.toEqual(0);
        const data = await collection.getCollectionData();
        expect(data.nextItemId).toEqual(0);
        expect(data.ownerAddress.toFriendly()).toEqual(OWNER.toFriendly());
    });
});
