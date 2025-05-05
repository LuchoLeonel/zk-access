use std::hash::poseidon;
use eddsa::eddsa_verify;

fn main(
    value: Field,
    key: pub Field,
    hash: pub Field,
    signature_R8x: pub Field,
    signature_R8y: pub Field,
    signature_S: pub Field,
    signer_x: pub Field,
    signer_y: pub Field
) {
    let combined_hash = poseidon::bn254::hash_2([key, value]);
    assert(combined_hash == hash);

    let is_valid = eddsa_verify::<poseidon::PoseidonHasher>(
        signer_x,
        signer_y,
        signature_S,
        signature_R8x,
        signature_R8y,
        combined_hash
    );

    assert(is_valid);
}
