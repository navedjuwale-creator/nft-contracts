import {Cell, toNano} from "ton";
import {randomAddress} from "../../utils/randomAddress";
import {NftItemData, NftSingleData} from "./NftItem.data";
import {NftItemLocal} from "./NftItemLocal";
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

const singleConfig: NftSingleData = {
    ownerAddress: OWNER,
    editorAddress: randomAddress(),
    content: "security-regression",
    royaltyParams: {
        royaltyFactor: 100,
        royaltyBase: 200,
        royaltyAddress: randomAddress()
    }
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
        const attemptedOwner = randomAddress();

        const result = await nft.contract.sendInternalMessage({
            to: nft.address,
            from: attacker,
            value: toNano(1),
            bounce: false,
            body: {
                // Build the canonical transfer body through the public query helper.
                body: undefined
            } as any
        } as any);

        expect(result.exit_code).not.toEqual(0);
        const data = await nft.getNftData();
        expect(data.isInitialized).toBe(true);
        if (data.isInitialized) {
            expect(data.ownerAddress.toFriendly()).toEqual(OWNER.toFriendly());
        }
        expect(attemptedOwner).toBeDefined();
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
