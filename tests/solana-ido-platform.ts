import * as anchor from "@coral-xyz/anchor";
import {Program} from "@coral-xyz/anchor";
import {SolanaIdoPlatform} from "../target/types/solana_ido_platform";
import {assert} from "chai";
import moment from "moment";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createMint,
  createMintToInstruction,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID
} from "@solana/spl-token";
import * as console from "node:console";

const sleep = (seconds) => {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
};

/*
Mock function for buy `amount` of token for a `buyer`.
`signer` is a person who signs.
 */
const getBuySignature = async (program: Program<SolanaIdoPlatform>, signer: anchor.web3.Keypair, buyer: anchor.web3.PublicKey, amount: number, inputMint: anchor.web3.PublicKey, tokenMint: anchor.web3.PublicKey) => {
  const transaction = new anchor.web3.Transaction();
  const instruction = await program.methods.buyToken(
    new anchor.BN(amount),
  ).accounts({
    backend: signer.publicKey,
    buyer: buyer,
    inputMint: inputMint,
    tokenMint: tokenMint,
  }).instruction();
  transaction.add(instruction);
  // console.log(`buyer: ${buyer.toBase58()}`)
  // console.log(`signer: ${signer.publicKey.toBase58()}`)
  const provider = anchor.AnchorProvider.env();
  const latestBlockhash = await provider.connection.getLatestBlockhash();
  transaction.recentBlockhash = latestBlockhash.blockhash;
  transaction.feePayer = buyer;
  transaction.partialSign(signer);
  return transaction.serialize({requireAllSignatures: false});
}
describe("solana-ido-platform", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.AnchorProvider.env();

  const program = anchor.workspace.SolanaIdoPlatform as Program<SolanaIdoPlatform>;

  const owner = anchor.web3.Keypair.generate();
  const creator = anchor.web3.Keypair.generate();
  const inputMint = anchor.web3.Keypair.generate();
  const tokenMint = anchor.web3.Keypair.generate();
  const user = anchor.web3.Keypair.generate();
  const receiver = anchor.web3.Keypair.generate();

  const eventParser = new anchor.EventParser(program.programId, program.coder);

  const CONFIG_ACCOUNT_SEED = "ido_platform_seed";
  const POOL_SEED = "ido_platform_pool_seed";
  const USER_ACCOUNT_SEED = "ido_platform_account_seed";

  const [configAccount] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from(CONFIG_ACCOUNT_SEED)],
    program.programId
  );

  before(async () => {
    // Request airdrop
    await Promise.all(
      [owner.publicKey, creator.publicKey, user.publicKey, receiver.publicKey].map(async (address) => {
        await provider.connection.confirmTransaction(
          await provider.connection.requestAirdrop(address, 1_000 * 10 ** 9)
        );
      })
    );
    // initialize mint token
    await Promise.all([
      createMint(
        provider.connection,
        owner,
        owner.publicKey,
        null,
        6,
        inputMint,
        {commitment: "confirmed"},
        TOKEN_PROGRAM_ID
      ),
      createMint(
        provider.connection,
        owner,
        owner.publicKey,
        null,
        6,
        tokenMint,
        {commitment: "confirmed"},
        TOKEN_PROGRAM_ID
      ),
    ]);
    // Mint test token
    [user, receiver].map(async (account) => {
      const mintTransaction = new anchor.web3.Transaction();
      const inputMintAccount = getAssociatedTokenAddressSync(
        inputMint.publicKey,
        account.publicKey,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );
      const ataAccount = await provider.connection.getAccountInfo(inputMintAccount)
      if (!ataAccount) {
        const createATAInstruction = createAssociatedTokenAccountInstruction(
          account.publicKey,
          inputMintAccount,
          account.publicKey,
          inputMint.publicKey,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        );
        mintTransaction.add(createATAInstruction);

        const accountATA = getAssociatedTokenAddressSync(
          inputMint.publicKey,
          account.publicKey,
          true,
          TOKEN_PROGRAM_ID
        );

        const mintToInstruction = createMintToInstruction(
          inputMint.publicKey,
          accountATA,
          owner.publicKey,
          1_000_000_000 * 10 ** 6,
          [owner],
          TOKEN_PROGRAM_ID
        )
        mintTransaction.add(mintToInstruction);
        try {
          await anchor.web3.sendAndConfirmTransaction(
            provider.connection,
            mintTransaction,
            [account, owner],
            {skipPreflight: true}
          )
        } catch (e) {
          console.error(e);
        }
      }
    })
  });

  it("Is initialized!!!", async () => {
    // Add your test here.
    const tx = await program.methods.initialize(owner.publicKey, creator.publicKey)
      // .accounts({configAccount})
      .rpc();
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
    // console.log(parsedTransaction.meta.logMessages);
  });

  const startTime = Math.floor(moment().valueOf() / 1000);
  const endTime = Math.floor(moment().add(500, "seconds").valueOf() / 1000);
  const claimTime = Math.floor(moment().add(500, "seconds").valueOf() / 1000);
  const tokenForSale = 1_000_000;
  const tokenSold = 0
  const tokenRate = 1;
  const tokenRateDecimals = 2;


  describe("Create pool", async () => {
    it.skip("Should revert if create pool by account is not a creator", async () => {
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
            inputMint.publicKey,
            tokenMint.publicKey,
            owner.publicKey,
            receiver.publicKey,
          )
          .accounts({signer: owner.publicKey})
          .signers([owner])
          .rpc();
        assert.equal("Should revert but it didnt", "");
      } catch (error) {
        //console.log(error);
        assert.equal(error.error.errorCode.code, "Unauthorized");
        assert.equal(error.error.errorMessage, "Unauthorized");
      }
    });
    it.skip("Should revert if invalid time", async () => {
      try {
        const wrongStartTime = endTime + 10_000;
        await program.methods
          .createPool(
            new anchor.BN(wrongStartTime),
            new anchor.BN(endTime),
            new anchor.BN(claimTime),
            new anchor.BN(tokenForSale),
            new anchor.BN(tokenSold),
            new anchor.BN(tokenRate),
            tokenRateDecimals,
            inputMint.publicKey,
            tokenMint.publicKey,
            creator.publicKey,
            receiver.publicKey,
          )
          .accounts({signer: creator.publicKey})
          .signers([creator])
          .rpc();
        assert.equal("Should revert but it didnt", "");
      } catch (error) {
        // console.log(error);
        assert.equal(error.error.errorCode.code, "InvalidPoolTime");
      }
    });
    it("Should create pool successfully", async () => {
      const tx = await program.methods
        .createPool(
          new anchor.BN(startTime),
          new anchor.BN(endTime),
          new anchor.BN(claimTime),
          new anchor.BN(tokenForSale),
          new anchor.BN(tokenSold),
          new anchor.BN(tokenRate),
          tokenRateDecimals,
          inputMint.publicKey,
          tokenMint.publicKey,
          creator.publicKey,
          receiver.publicKey,
        )
        .accounts({signer: creator.publicKey})
        .signers([creator])
        .rpc();
      await sleep(1);
      const txDetails = await provider.connection.getParsedTransaction(tx, {commitment: "confirmed"});
      const events = eventParser.parseLogs(
        txDetails?.meta?.logMessages
      );
      let parsedEvents = [];
      for (const event of events) {
        parsedEvents.push(event);
      }
      const poolCreatedEvent = parsedEvents.find(
        (event) => event.name === "poolCreatedEvent"
      );
      assert.equal(
        poolCreatedEvent.data.signer.toBase58(),
        creator.publicKey.toBase58()
      );
      assert.equal(
        poolCreatedEvent.data.acceptCurrency.toBase58(),
        inputMint.publicKey.toBase58()
      );

    });
  });

  describe("Buy token", async () => {
    before(async () => {
      // Create pool
      // No-need the following code because it is already created the pool in the previous test

      // await program.methods
      //   .createPool(
      //     new anchor.BN(startTime),
      //     new anchor.BN(endTime),
      //     new anchor.BN(claimTime),
      //     new anchor.BN(tokenForSale),
      //     new anchor.BN(tokenSold),
      //     new anchor.BN(tokenRate),
      //     tokenRateDecimals,
      //     inputMint.publicKey,
      //     tokenMint.publicKey,
      //     creator.publicKey,
      //     receiver.publicKey,
      //   )
      //   .accounts({signer: creator.publicKey})
      //   .signers([creator])
      //   .rpc();
    })
    it("Check signature", async () => {
      const sig = await getBuySignature(program,creator,user.publicKey,100,inputMint.publicKey, tokenMint.publicKey);
      console.log(sig)

    })
    it.skip("Should buy token successfully", async () => {

      const signature = await program.methods.buyToken(
        new anchor.BN(100),
      ).accounts({
        buyer: user.publicKey,
        inputMint: inputMint.publicKey,
        tokenMint: tokenMint.publicKey,
      })
        .signers([user])
        .rpc()
    })
  })
});
