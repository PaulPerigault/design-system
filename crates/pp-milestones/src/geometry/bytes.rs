//! Octets petit-boutistes, prêts pour `bufferData` sans `unsafe`.

/// Flottants en octets.
#[must_use]
pub fn floats_to_bytes(values: &[f32]) -> Vec<u8> {
    values
        .iter()
        .flat_map(|value| value.to_le_bytes())
        .collect()
}

#[must_use]
pub fn indices_to_bytes(values: &[u32]) -> Vec<u8> {
    values
        .iter()
        .flat_map(|value| value.to_le_bytes())
        .collect()
}
