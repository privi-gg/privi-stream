pragma circom 2.0.0;

include "../../../node_modules/circomlib/circuits/comparators.circom";
include "../../../node_modules/circomlib/circuits/poseidon.circom";
include "./merkleProof.circom";
include "./keyPair.circom";

// Stream { rate, startTime, stopTime,
//        senderPubKey, receiverPubKey, blinding }
// commitment = hash(Stream)
// nullifier = hash(commitment, merklePath)

template Create() {
    signal input publicAmount; // total stream amount

    signal input rate;
    signal input startTime;
    signal input stopTime;
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

    // ===========================================
    // Verify correctness of amounts
    // ===========================================

    // Assert `publicAmount` must be fully consumed by total duration 
    // at `rate` tokens/sec
    publicAmount === (stopTime - startTime) * rate;

    // ===========================================
    // Verify correctness of commitment
    // ===========================================
    component senderKeyPair = KeyPair();
    component commitmentHasher = Poseidon(6);

    senderKeyPair.privateKey <== senderPrivateKey;

    commitmentHasher.inputs[0] <== rate;
    commitmentHasher.inputs[1] <== startTime;
    commitmentHasher.inputs[2] <== stopTime;
    commitmentHasher.inputs[3] <== senderKeyPair.publicKey;
    commitmentHasher.inputs[4] <== receiverPublicKey;
    commitmentHasher.inputs[5] <== blinding;

    commitment === commitmentHasher.out;
}

component main { public [publicAmount, commitment] } = Create();