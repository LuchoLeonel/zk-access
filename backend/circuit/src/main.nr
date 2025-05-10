use std::hash::poseidon;
use eddsa::eddsa_verify;

fn main(
    values: [Field; 10],
    keys: pub [Field; 10],
    hashes: pub [Field; 10],
    compared_values: pub [Field; 10],
    operations: pub [Field; 10],
    signature_R8xs: pub [Field; 10],
    signature_R8ys: pub [Field; 10],
    signature_Ss: pub [Field; 10],
    signer_x: pub Field,
    signer_y: pub Field,
) {
    for i in 0..10 {
        let stop_flag =
            (values[i] == 0) as u8 +
            (keys[i] == 0) as u8 +
            (hashes[i] == 0) as u8 +
            (compared_values[i] == 0) as u8 +
            (operations[i] == 0) as u8;
        let should_process = stop_flag != 5;

        if should_process {
            let hash_value = poseidon::bn254::hash_1([values[i]]);
            let hash_key = poseidon::bn254::hash_1([keys[i]]);
            let combined_hash = poseidon::bn254::hash_2([hash_key, hash_value]);
            assert(combined_hash == hashes[i]);

            if operations[i] == 0 {
                assert(values[i] == compared_values[i]);
            } else if operations[i] == 1 {
                let v = values[i] as u64;
                let c = compared_values[i] as u64;
                assert(v > c);
            } else if operations[i] == 2 {
                let v = values[i] as u64;
                let c = compared_values[i] as u64;
                assert(v < c);
            } else {
                assert(false);
            }

            // Firma
            let is_valid = eddsa_verify::<poseidon::PoseidonHasher>(
                signer_x,
                signer_y,
                signature_Ss[i],
                signature_R8xs[i],
                signature_R8ys[i],
                combined_hash
            );

            assert(is_valid);
        }
    }
}
