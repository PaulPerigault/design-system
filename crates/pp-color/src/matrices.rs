//! Matrices d'Oklab. Source : Björn Ottosson, « A perceptual color space for image processing »
//! (2020), <https://bottosson.github.io/posts/oklab/> (révision du 25 janvier 2021), mêmes valeurs
//! que `packages/tokens/src/lib/color-data.ts`. Une ligne par sortie ; LMS' = LMS après racine cubique.

pub(crate) type Matrix = [[f64; 3]; 3];
pub(crate) type Vec3 = [f64; 3];

pub(crate) const OKLAB_TO_LMS_PRIME: Matrix = [
    [1.0, 0.396_337_777_4, 0.215_803_757_3],
    [1.0, -0.105_561_345_8, -0.063_854_172_8],
    [1.0, -0.089_484_177_5, -1.291_485_548],
];
pub(crate) const LMS_TO_LINEAR_SRGB: Matrix = [
    [4.076_741_662_1, -3.307_711_591_3, 0.230_969_929_2],
    [-1.268_438_004_6, 2.609_757_401_1, -0.341_319_396_5],
    [-0.004_196_086_3, -0.703_418_614_7, 1.707_614_701],
];
pub(crate) const LINEAR_SRGB_TO_LMS: Matrix = [
    [0.412_221_470_8, 0.536_332_536_3, 0.051_445_992_9],
    [0.211_903_498_2, 0.680_699_545_1, 0.107_396_956_6],
    [0.088_302_461_9, 0.281_718_837_6, 0.629_978_700_5],
];
pub(crate) const LMS_PRIME_TO_OKLAB: Matrix = [
    [0.210_454_255_3, 0.793_617_785, -0.004_072_046_8],
    [1.977_998_495_1, -2.428_592_205, 0.450_593_709_9],
    [0.025_904_037_1, 0.782_771_766_2, -0.808_675_766],
];

fn dot(row: Vec3, vector: Vec3) -> f64 {
    row.iter()
        .zip(vector)
        .map(|(coefficient, input)| coefficient * input)
        .sum()
}

pub(crate) fn multiply(matrix: &Matrix, vector: Vec3) -> Vec3 {
    let [row_x, row_y, row_z] = *matrix;
    [dot(row_x, vector), dot(row_y, vector), dot(row_z, vector)]
}
