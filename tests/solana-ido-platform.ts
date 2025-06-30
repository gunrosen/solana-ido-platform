import * as anchor from "@coral-xyz/anchor";
import {Program} from "@coral-xyz/anchor";
import {SolanaIdoPlatform} from "../target/types/solana_ido_platform";
import {assert} from "chai";
import moment from "moment";

const sleep = (seconds) => {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
};
describe("solana-ido-platform", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.AnchorProvider.env();

  const program = anchor.workspace.SolanaIdoPlatform as Program<SolanaIdoPlatform>;

  const owner = anchor.web3.Keypair.generate();
  const creator = anchor.web3.Keypair.generate();
  const currency = anchor.web3.Keypair.generate();
  const token = anchor.web3.Keypair.generate();
  const signer = anchor.web3.Keypair.generate();
  const receiver = anchor.web3.Keypair.generate();

  const eventParser = new anchor.EventParser(program.programId, program.coder);

  const CONFIG_ACCOUNT_SEED = "ido_platform_seed";

  const [configAccount] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from(CONFIG_ACCOUNT_SEED)],
    program.programId
  );

  before(async () => {
    await Promise.all(
      [owner.publicKey, creator.publicKey].map(async (address) => {
        // await provider.connection.requestAirdrop(
        //   address,
        //   2 * 10 ** 9
        // );
        await provider.connection.confirmTransaction(
          await provider.connection.requestAirdrop(address, 1_000 * 10 ** 9)
        );
      })
    );
  });

  it("Is initialized!!!", async () => {
    // Add your test here.
    const tx = await program.methods.initialize(owner.publicKey, creator.publicKey)
      // .accounts({configAccount})
      .rpc();
    console.log("Your transaction signature", tx);
    const configInfo = await program.account.configAccount.fetch(configAccount);

    assert.equal(configInfo.owner.toBase58(), owner.publicKey.toBase58());
    assert.equal(configInfo.creator.toBase58(), creator.publicKey.toBase58());

    await sleep(1);
    const parsedTransaction = await provider.connection.getParsedTransaction(
      tx,
      {
        maxSupportedTransactionVersion: 0,
        commitment: "confirmed",
      }
    );
    console.log(parsedTransaction.meta.logMessages);
  });

  const startTime = Math.floor(moment().add(10, "seconds").valueOf() / 1000);
  const endTime = Math.floor(moment().add(50, "seconds").valueOf() / 1000);
  const claimTime = Math.floor(moment().add(50, "seconds").valueOf() / 1000);
  const tokenForSale = 1_000_000;
  const tokenSold = 0
  const tokenRate = 1;
  const tokenRateDecimals = 2;


  describe("Create pool", async () => {
    it("Should revert if create pool by account is not a creator", async () => {
      try {
        await program.methods
          .createPool(
            new anchor.BN(startTime),
            new anchor.BN(endTime),
            new anchor.BN(claimTime),
            new anchor.BN(tokenForSale),
            new anchor.BN(tokenSold),
            new anchor.BN(tokenRate),
            tokenRateDecimals,
            currency.publicKey,
            token.publicKey,
            signer.publicKey,
            receiver.publicKey,
          )
          .accounts({signer: owner.publicKey})
          .signers([owner])
          .rpc();
        assert.equal("Should revert but it didnt", "");
      } catch (error) {
        console.log(error);
        assert.equal(error.error.errorCode.code, "Unauthorized");
        assert.equal(error.error.errorMessage, "Unauthorized");
      }
    });
    it("Should revert if invalid time", async () => {
      try {
        const wrongStartTime = endTime + 10_000;
        await program.methods
          .createPool(
            new anchor.BN(startTime),
            new anchor.BN(endTime),
            new anchor.BN(claimTime),
            new anchor.BN(tokenForSale),
            new anchor.BN(tokenSold),
            new anchor.BN(tokenRate),
            tokenRateDecimals,
            currency.publicKey,
            token.publicKey,
            signer.publicKey,
            receiver.publicKey,
          )
          .accounts({signer: creator.publicKey})
          .signers([creator])
          .rpc();
        assert.equal("Should revert but it didnt", "");
      } catch (error) {
        console.log(error);
        assert.equal(error.error.errorCode.code, "InvalidPoolTime");
      }
    });
    it("Should create pool successfully", async () => {
      try {
        await program.methods
          .createPool(
            new anchor.BN(startTime),
            new anchor.BN(endTime),
            new anchor.BN(claimTime),
            new anchor.BN(tokenForSale),
            new anchor.BN(tokenSold),
            new anchor.BN(tokenRate),
            tokenRateDecimals,
            currency.publicKey,
            token.publicKey,
            signer.publicKey,
            receiver.publicKey,
          )
          .accounts({signer: creator.publicKey})
          .signers([creator])
          .rpc();
      } catch (error) {
        console.log(error);
      }
    });
  });
});
