import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;

describe("Content Marketplace", () => {

  it("ensures simnet is well initialized", () => {
    expect(simnet.blockHeight).toBeDefined();
  });

  describe("Listing Content", () => {
    it("allows creator to list new content", () => {
      const { result } = simnet.callPublicFn(
        "content-marketplace",
        "list-content",
        [
          Cl.uint(100),  // price: 100 USDCx
          Cl.uint(144),  // duration: 144 blocks (~1 day)
          Cl.stringAscii("ipfs://QmTest123")
        ],
        deployer
      );

      expect(result).toBeOk(Cl.uint(1)); // First content ID should be 1
    });

    it("increments content ID for each new listing", () => {
      // List first content
      simnet.callPublicFn(
        "content-marketplace",
        "list-content",
        [Cl.uint(100), Cl.uint(144), Cl.stringAscii("ipfs://QmTest1")],
        deployer
      );

      // List second content
      const { result } = simnet.callPublicFn(
        "content-marketplace",
        "list-content",
        [Cl.uint(200), Cl.uint(288), Cl.stringAscii("ipfs://QmTest2")],
        deployer
      );

      expect(result).toBeOk(Cl.uint(2)); // Should be content ID 2
    });

    it("stores correct listing information", () => {
      simnet.callPublicFn(
        "content-marketplace",
        "list-content",
        [Cl.uint(150), Cl.uint(100), Cl.stringAscii("ipfs://QmDataset")],
        deployer
      );

      const listing = simnet.callReadOnlyFn(
        "content-marketplace",
        "get-content-listing",
        [Cl.uint(1)],
        deployer
      );

      expect(listing.result).toBeSome(
        Cl.tuple({
          creator: Cl.principal(deployer),
          "price-per-access": Cl.uint(150),
          "access-duration": Cl.uint(100),
          "is-active": Cl.bool(true),
          "metadata-uri": Cl.stringAscii("ipfs://QmDataset")
        })
      );
    });
  });

  describe("Purchasing Access", () => {
    it("allows user to purchase access with correct payment", () => {
      // Creator lists content
      simnet.callPublicFn(
        "content-marketplace",
        "list-content",
        [Cl.uint(100), Cl.uint(144), Cl.stringAscii("ipfs://QmAPI")],
        deployer
      );

      // User purchases access
      const { result } = simnet.callPublicFn(
        "content-marketplace",
        "purchase-access",
        [Cl.uint(1), Cl.uint(100)],
        wallet1
      );

      expect(result).toBeOk(Cl.bool(true));
    });

    it("grants valid access after purchase", () => {
      // List and purchase
      simnet.callPublicFn(
        "content-marketplace",
        "list-content",
        [Cl.uint(100), Cl.uint(144), Cl.stringAscii("ipfs://QmTest")],
        deployer
      );

      simnet.callPublicFn(
        "content-marketplace",
        "purchase-access",
        [Cl.uint(1), Cl.uint(100)],
        wallet1
      );

      // Check access
      const hasAccess = simnet.callReadOnlyFn(
        "content-marketplace",
        "has-valid-access",
        [Cl.uint(1), Cl.principal(wallet1)],
        wallet1
      );

      expect(hasAccess.result).toBeBool(true);
    });

    it("rejects purchase with insufficient payment", () => {
      simnet.callPublicFn(
        "content-marketplace",
        "list-content",
        [Cl.uint(100), Cl.uint(144), Cl.stringAscii("ipfs://QmTest")],
        deployer
      );

      const { result } = simnet.callPublicFn(
        "content-marketplace",
        "purchase-access",
        [Cl.uint(1), Cl.uint(50)], // Only 50, need 100
        wallet1
      );

      expect(result).toBeErr(Cl.uint(103)); // err-insufficient-payment
    });

    it("rejects purchase of non-existent content", () => {
      const { result } = simnet.callPublicFn(
        "content-marketplace",
        "purchase-access",
        [Cl.uint(999), Cl.uint(100)],
        wallet1
      );

      expect(result).toBeErr(Cl.uint(101)); // err-not-found
    });

    it("updates content statistics after purchase", () => {
      simnet.callPublicFn(
        "content-marketplace",
        "list-content",
        [Cl.uint(100), Cl.uint(144), Cl.stringAscii("ipfs://QmStats")],
        deployer
      );

      // First purchase
      simnet.callPublicFn(
        "content-marketplace",
        "purchase-access",
        [Cl.uint(1), Cl.uint(100)],
        wallet1
      );

      // Second purchase
      simnet.callPublicFn(
        "content-marketplace",
        "purchase-access",
        [Cl.uint(1), Cl.uint(100)],
        wallet2
      );

      const stats = simnet.callReadOnlyFn(
        "content-marketplace",
        "get-content-stats",
        [Cl.uint(1)],
        deployer
      );

      expect(stats.result).toBeSome(
        Cl.tuple({
          "total-revenue": Cl.uint(200),
          "access-count": Cl.uint(2)
        })
      );
    });
  });

  describe("Access Management", () => {
    it("denies access to users who haven't purchased", () => {
      simnet.callPublicFn(
        "content-marketplace",
        "list-content",
        [Cl.uint(100), Cl.uint(144), Cl.stringAscii("ipfs://QmTest")],
        deployer
      );

      const hasAccess = simnet.callReadOnlyFn(
        "content-marketplace",
        "has-valid-access",
        [Cl.uint(1), Cl.principal(wallet1)],
        wallet1
      );

      expect(hasAccess.result).toBeBool(false);
    });

    it("access expires after duration", () => {
      simnet.callPublicFn(
        "content-marketplace",
        "list-content",
        [Cl.uint(100), Cl.uint(10), Cl.stringAscii("ipfs://QmShortAccess")], // 10 blocks
        deployer
      );

      simnet.callPublicFn(
        "content-marketplace",
        "purchase-access",
        [Cl.uint(1), Cl.uint(100)],
        wallet1
      );

      // Mine 11 blocks to expire access
      simnet.mineEmptyBlocks(11);

      const hasAccess = simnet.callReadOnlyFn(
        "content-marketplace",
        "has-valid-access",
        [Cl.uint(1), Cl.principal(wallet1)],
        wallet1
      );

      expect(hasAccess.result).toBeBool(false);
    });
  });

  describe("Content Deactivation", () => {
    it("allows creator to deactivate their content", () => {
      simnet.callPublicFn(
        "content-marketplace",
        "list-content",
        [Cl.uint(100), Cl.uint(144), Cl.stringAscii("ipfs://QmTest")],
        deployer
      );

      const { result } = simnet.callPublicFn(
        "content-marketplace",
        "deactivate-content",
        [Cl.uint(1)],
        deployer
      );

      expect(result).toBeOk(Cl.bool(true));
    });

    it("prevents non-creator from deactivating content", () => {
      simnet.callPublicFn(
        "content-marketplace",
        "list-content",
        [Cl.uint(100), Cl.uint(144), Cl.stringAscii("ipfs://QmTest")],
        deployer
      );

      const { result } = simnet.callPublicFn(
        "content-marketplace",
        "deactivate-content",
        [Cl.uint(1)],
        wallet1  // Not the creator
      );

      expect(result).toBeErr(Cl.uint(102)); // err-unauthorized
    });

    it("prevents purchase of deactivated content", () => {
      simnet.callPublicFn(
        "content-marketplace",
        "list-content",
        [Cl.uint(100), Cl.uint(144), Cl.stringAscii("ipfs://QmTest")],
        deployer
      );

      simnet.callPublicFn(
        "content-marketplace",
        "deactivate-content",
        [Cl.uint(1)],
        deployer
      );

      const { result } = simnet.callPublicFn(
        "content-marketplace",
        "purchase-access",
        [Cl.uint(1), Cl.uint(100)],
        wallet1
      );

      expect(result).toBeErr(Cl.uint(101)); // err-not-found (inactive)
    });
  });
});