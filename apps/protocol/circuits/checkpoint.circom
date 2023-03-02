pragma circom 2.0.0;

include "../../../node_modules/circomlib/circuits/comparators.circom";
include "../../../node_modules/circomlib/circuits/poseidon.circom";
include "./merkleProof.circom";
include "./keyPair.circom";

// Stream { rate, startTime, stopTime, senderPubKey, receiverPubKey, blinding }
// Checkpoint { streamCommitment, checkpointTime, blinding }
// commitment = hash(Checkpoint)
// nullifier = hash(commitment, blinding, merklePath)
// The first ever input `Checkpoint` for a `Stream` should have:
// checkpoint.checkpointTime == stream.startTime && checkpoint.blinding == stream.blinding
// This is to have an initial "zero" input to spend & prevent multiple
// "zero" inital inputs

template Checkpoint(nStreamLevels, nCheckpointLevels) {
    // checked at contract that currentTime <= block.timestamp
    signal input currentTime; 

    // withdraw amount + fee
    signal input publicAmount; 

    // ===========================================
    // STREAM SIGNALS
    // ===========================================
    signal input streamRoot;
    signal input streamRate;
    signal input streamStartTime;
    signal input streamStopTime;
    signal input streamSenderPublicKey;
    signal input streamReceiverPrivateKey;
    signal input streamBlinding; 
    signal input streamPathIndices; 
    signal input streamPathElements[nStreamLevels]; 

    // ===========================================
    // INPUT CHECKPOINT SIGNALS
    // ===========================================
    signal input checkpointRoot;
    signal input inCheckpointTime;
    signal input inCheckpointBlinding;
    signal input inCheckpointNullifier;

    signal input inCheckpointPathIndices;
    signal input inCheckpointPathElements[nCheckpointLevels];

    // ===========================================
    // OUTPUT CHECKPOINT SIGNALS
    // ===========================================
    // Checked by contract for a past timestamp
    signal input outCheckpointTime; 
    signal input outCheckpointBlinding;
    signal input outCheckpointCommitment;

    // ===========================================
    // VERIFY TIMESTAMPS
    // ===========================================
    // Asserts outCheckpointTime > inCheckpointTime
    component isGt = GreaterThan(64);
    isGt.in[0] <== outCheckpointTime;
    isGt.in[1] <== inCheckpointTime;
    isGt.out === 1;

    // Asserts outCheckpointTime <= streamStopTime
    component isLtEq = LessEqThan(64);
    isLtEq.in[0] <== outCheckpointTime;
    isLtEq.in[1] <== streamStopTime;
    isLtEq.out === 1;

    // Asserts outCheckpointTime < currentTime
    component isLt = LessThan(64);
    isLt.in[0] <== outCheckpointTime;
    isLt.in[1] <== currentTime;
    isLt.out === 1;

    // ===========================================
    // VERIFY AMOUNT
    // ===========================================
    publicAmount === (outCheckpointTime - inCheckpointTime) * streamRate;

    // ===========================================
    // VERIFY CORRECTNESS OF STREAM
    // ===========================================
    component receiverKeyPair = KeyPair();
    receiverKeyPair.privateKey <== streamReceiverPrivateKey;

    component streamCommitmentHasher = Poseidon(6);
    streamCommitmentHasher.inputs[0] <== streamRate;
    streamCommitmentHasher.inputs[1] <== streamStartTime;
    streamCommitmentHasher.inputs[2] <== streamStopTime;
    streamCommitmentHasher.inputs[3] <== streamSenderPublicKey;
    streamCommitmentHasher.inputs[4] <== receiverKeyPair.publicKey;
    streamCommitmentHasher.inputs[5] <== streamBlinding;

    // Asserts stream existence in tree
    component streamTree = MerkleProof(nStreamLevels);
    streamTree.leaf <== streamCommitmentHasher.out;
    streamTree.pathIndices <== streamPathIndices;
    for (var i = 0; i < nStreamLevels; i++) {
        streamTree.pathElements[i] <== streamPathElements[i];
    }
    streamTree.root === streamRoot;

    // Note: No need to check for stream nullifier since
    // it is not nullifying the stream

    // ===========================================
    // VERIFY CORRECTNESS OF INPUT CHECKPOINT
    // ===========================================
    component inCheckpointCommitmentHasher = Poseidon(3);
    inCheckpointCommitmentHasher.inputs[0] <== streamCommitmentHasher.out;
    inCheckpointCommitmentHasher.inputs[1] <== inCheckpointTime;
    inCheckpointCommitmentHasher.inputs[2] <== inCheckpointBlinding;

    // Asserts correctness of checkpoint nullifier
    component checkpointNullifierHasher = Poseidon(3);
    checkpointNullifierHasher.inputs[0] <== inCheckpointCommitmentHasher.out;
    checkpointNullifierHasher.inputs[1] <== inCheckpointBlinding;
    checkpointNullifierHasher.inputs[2] <== inCheckpointPathIndices;
    checkpointNullifierHasher.out === inCheckpointNullifier;

    // Asserts checkpoint existence in tree
    component checkpointTree = MerkleProof(nCheckpointLevels);
    checkpointTree.leaf <== inCheckpointCommitmentHasher.out;
    checkpointTree.pathIndices <== inCheckpointPathIndices;
    for (var i = 0; i < nCheckpointLevels; i++) {
        checkpointTree.pathElements[i] <== inCheckpointPathElements[i];
    }

    // Skips the root inclusion constraint if 
    // inCheckpointTime == streamStartTime && inCheckpointBlinding == streamBlinding
    // Such `Checkpoint` aka "zero checkpoint" is required as input during first withdraw
    signal isCheckpointStartTime <== 1 - (inCheckpointTime - streamStartTime);
    signal isSameBlinding <== 1 - (inCheckpointBlinding - streamBlinding);

    component checkCheckpointRoot = ForceEqualIfEnabled();
    checkCheckpointRoot.in[0] <== checkpointRoot;
    checkCheckpointRoot.in[1] <== checkpointTree.root;
    checkCheckpointRoot.enabled <== 1 - isCheckpointStartTime * isSameBlinding;

    // ===========================================
    // VERIFY CORRECTNESS OF OUTPUT CHECKPOINT
    // ===========================================
    component outCheckpointCommitmentHasher = Poseidon(3);
    outCheckpointCommitmentHasher.inputs[0] <== streamCommitmentHasher.out;
    outCheckpointCommitmentHasher.inputs[1] <== outCheckpointTime;
    outCheckpointCommitmentHasher.inputs[2] <== outCheckpointBlinding;
    outCheckpointCommitmentHasher.out === outCheckpointCommitment;
}

component main { public [currentTime, publicAmount, streamRoot, checkpointRoot, inCheckpointNullifier, outCheckpointCommitment] } = Checkpoint(21, 23);