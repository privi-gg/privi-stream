#!/bin/bash

# circuit will support max 2^POWERS_OF_TAU constraints
POWERS_OF_TAU=18

OUT_DIR=artifacts/circuits

SOURCE_FILE=$1
VERFIER_OUT_DIR=contracts/verifiers
VERFIER_OUT_FILE=${1^}Verifier.sol

mkdir -p $OUT_DIR
mkdir -p $VERFIER_OUT_DIR

# Download .ptau contibutions, if not already downloaded
if [ ! -f $OUT_DIR/ptau$POWERS_OF_TAU ]; then
  echo "Downloading powers of tau file"
  curl -L https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_$POWERS_OF_TAU.ptau --create-dirs -o $OUT_DIR/ptau$POWERS_OF_TAU
fi

# NOTE: Make sure circom is install as per here: https://docs.circom.io/getting-started/installation/
$HOME/.cargo/bin/circom --version

# Compile circuit
$HOME/.cargo/bin/circom circuits/$SOURCE_FILE.circom --r1cs --wasm --sym --output $OUT_DIR

# Generate .zkey
snarkjs groth16 setup $OUT_DIR/$SOURCE_FILE.r1cs $OUT_DIR/ptau$POWERS_OF_TAU $OUT_DIR/tmp_$SOURCE_FILE.zkey

# Contribute to phase 2
echo "qwe" | snarkjs zkey contribute $OUT_DIR/tmp_$SOURCE_FILE.zkey $OUT_DIR/$SOURCE_FILE.zkey

# Export solidity verifier
snarkjs zkey export solidityverifier $OUT_DIR/$SOURCE_FILE.zkey $VERFIER_OUT_DIR/$VERFIER_OUT_FILE
