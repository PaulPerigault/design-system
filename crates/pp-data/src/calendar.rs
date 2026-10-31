//! Dates ISO 8601 lues en UTC et clés de groupe. Même grammaire et mêmes refus que `parseIsoDate`
//! (`iso-date.ts`) : `AAAA`, `AAAA-MM`, `AAAA-MM-JJ`, `AAAA-MM-JJThh:mmZ`, `AAAA-MM-JJThh:mm:ssZ`.

/// Regroupement des points : par texte d'axe, ou par jour, mois ou année UTC.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum GroupBy {
    Category,
    Day,
    Month,
    Year,
}

struct Date {
    year: u32,
    month: u32,
    day: u32,
}

const YEAR_DIGITS: usize = 4;
const PART_DIGITS: usize = 2;
const MAX_HOUR: u32 = 23;
const MAX_MINUTE: u32 = 59;
/// `Date.UTC` lit les années 0 à 99 comme 1900 à 1999 : `parseIsoDate` les refuse, donc ici aussi.
const MIN_YEAR: u32 = 100;
const DAYS: [u32; 12] = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const FEBRUARY: u32 = 2;
const LEAP_DAYS: u32 = 29;

/// Nombre à exactement `width` chiffres ASCII (ni signe, ni espace).
fn number(text: &str, width: usize) -> Option<u32> {
    if text.len() == width && text.bytes().all(|byte| byte.is_ascii_digit()) {
        text.parse().ok()
    } else {
        None
    }
}

/// Partie optionnelle : absente donne `fallback`, présente doit avoir deux chiffres.
fn part<'a>(parts: &mut impl Iterator<Item = &'a str>, fallback: u32) -> Option<u32> {
    parts
        .next()
        .map_or(Some(fallback), |text| number(text, PART_DIGITS))
}

fn is_leap(year: u32) -> bool {
    year.is_multiple_of(4) && (!year.is_multiple_of(100) || year.is_multiple_of(400))
}

fn days_in_month(year: u32, month: u32) -> Option<u32> {
    let days = *DAYS.get(usize::try_from(month.checked_sub(1)?).ok()?)?;
    Some(if month == FEBRUARY && is_leap(year) {
        LEAP_DAYS
    } else {
        days
    })
}

/// `hh:mmZ` ou `hh:mm:ssZ`, heure 0 à 23, minute et seconde 0 à 59.
fn valid_time(text: &str) -> bool {
    let Some(body) = text.strip_suffix('Z') else {
        return false;
    };
    let mut parts = body.split(':');
    let hour = parts.next().and_then(|p| number(p, PART_DIGITS));
    let minute = parts.next().and_then(|p| number(p, PART_DIGITS));
    let second = part(&mut parts, 0);
    let complete = parts.next().is_none();
    complete
        && hour.is_some_and(|h| h <= MAX_HOUR)
        && minute.is_some_and(|m| m <= MAX_MINUTE)
        && second.is_some_and(|s| s <= MAX_MINUTE)
}

fn parse(text: &str) -> Option<Date> {
    let (date, time) = text
        .split_once('T')
        .map_or((text, None), |(d, t)| (d, Some(t)));
    let mut parts = date.split('-');
    let year = number(parts.next()?, YEAR_DIGITS)?;
    let month = part(&mut parts, 1)?;
    let has_day = date.matches('-').count() == 2;
    let day = part(&mut parts, 1)?;
    let calendar = parts.next().is_none() && year >= MIN_YEAR;
    let time_fits = time.is_none_or(|t| has_day && valid_time(t));
    let exists = days_in_month(year, month).is_some_and(|last| (1..=last).contains(&day));
    (calendar && time_fits && exists).then_some(Date { year, month, day })
}

/// Clé de groupe d'un texte d'axe : `AAAA-MM-JJ`, `AAAA-MM` ou `AAAA` ; `None` si la date n'existe
/// pas. Une date moins précise que le pas prend le premier mois ou le premier jour.
pub(crate) fn time_key(by: GroupBy, text: &str) -> Option<String> {
    let Date { year, month, day } = parse(text)?;
    Some(match by {
        GroupBy::Year => format!("{year:04}"),
        GroupBy::Month => format!("{year:04}-{month:02}"),
        GroupBy::Day | GroupBy::Category => format!("{year:04}-{month:02}-{day:02}"),
    })
}
