
# Tsunami
_Monorepo for Tsunami protocol._

Tsunami is a private token streaming protocol for streaming tokens on per-second basis privately.

Tsunami Contracts:

- Goerli - [0x56aDcC1BaF658C19FA4B149270e351db01957ca4](https://goerli.etherscan.io/address/0x56aDcC1BaF658C19FA4B149270e351db01957ca4)

- Polygon Mumbai - [0xbfCA28089Fbe5Ea7F6Fce568c6631149DD11935C](https://mumbai.polygonscan.com/address/0xbfCA28089Fbe5Ea7F6Fce568c6631149DD11935C)

## About
Tsunami utilizes the idea of a Stream as a UTXO Note which can be spent by either the stream Sender or the stream Receiver. But both parties are constrained to what parameters they can change in newly created UTXO after spending (and nullifying) the first one.

Tsunami uses zkSNARK verifiers which allows users to prove legitimacy of their intentions regarding spending a existing UTXO note.

Tsunami can be used by parties like individuals or DAOs to fund teams or projects they want to support while keeping any information about identity or even stream parameters (e.g. start/stop times of stream, rate of stream etc.) anonymized - which might be desirable in many situations like supporting some good cause. A Sender can also generate revoke proofs to stop stream early - in case funds are not used properly by Receiver party.

Tsunami stores encrypted stream UTXO notes as emitted events which can be decrypted by a shared secret key computed from any of the party's (sender/receiver) shielded private key & other party's (sender/receiver) shielded address/public key.