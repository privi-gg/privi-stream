pragma circom 2.0.0;

include "../../../node_modules/circomlib/circuits/comparators.circom";
include "../../../node_modules/circomlib/circuits/poseidon.circom";
include "./merkleProof.circom";
include "./keyPair.circom";


// UTXO { amount, startTime, stopTime, checkpointTime rate,
//        senderPubKey, receiverPubKey, blinding }
// commitment = hash(UTXO)
// nullifier = hash(commitment, merklePath)

template Create(nLevels, zeroLeaf) {
    signal input amount;
    signal input startTime;
    signal input stopTime;
    signal input checkpointTime;
    signal input rate; // tokens per sec.
    signal input senderPrivateKey;
    signal input receiverPublicKey;
    signal input blinding; 
    signal input commitment;

    // ===========================================
    // Verify correctness of timestamps
    // ===========================================

    // Assert startTime < stopTime
    component isLt = LessEqThan(64);
    isLt.in[0] <== startTime;
    isLt.in[1] <== stopTime;
    isLt.out === 1;

    // Assert checkpointTime == startTime
    checkpointTime === startTime;

    // ===========================================
    // Verify correctness of amounts
    // ===========================================

    // Assert `amount` must be fully consumed by total duration 
    // at `rate` tokens/sec
    amount === (stopTime - startTime) * rate;

    // ===========================================
    // Verify correctness of commitment
    // ===========================================
    component senderKeyPair = KeyPair();
    component commitmentHasher = Poseidon(8);

    senderKeyPair.privateKey <== senderPrivateKey;

    commitmentHasher.inputs[0] <== amount;
    commitmentHasher.inputs[1] <== startTime;
    commitmentHasher.inputs[2] <== stopTime;
    commitmentHasher.inputs[3] <== checkpointTime;
    commitmentHasher.inputs[4] <== rate;
    commitmentHasher.inputs[5] <== senderKeyPair.publicKey;
    commitmentHasher.inputs[6] <== receiverPublicKey;
    commitmentHasher.inputs[7] <== blinding;

    commitment === commitmentHasher.out;
}

component main { public [amount, commitment] } = Create(20, 11850551329423159860688778991827824730037759162201783566284850822760196767874);