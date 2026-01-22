use chrono::{Datelike, NaiveDate, Weekday};
use nom::{
    branch::alt,
    bytes::complete::tag_no_case,
    character::complete::{char, digit1, space1},
    combinator::{map, map_res, opt, value},
    sequence::{preceded, tuple},
    IResult,
};

use super::{DateSpec, RelativeDate};

fn parse_u32(input: &str) -> IResult<&str, u32> {
    map_res(digit1, |s: &str| s.parse::<u32>())(input)
}

fn month_name(input: &str) -> IResult<&str, u32> {
    alt((
        value(1, alt((tag_no_case("january"), tag_no_case("jan")))),
        value(2, alt((tag_no_case("february"), tag_no_case("feb")))),
        value(3, alt((tag_no_case("march"), tag_no_case("mar")))),
        value(4, alt((tag_no_case("april"), tag_no_case("apr")))),
        value(5, tag_no_case("may")),
        value(6, alt((tag_no_case("june"), tag_no_case("jun")))),
        value(7, alt((tag_no_case("july"), tag_no_case("jul")))),
        value(8, alt((tag_no_case("august"), tag_no_case("aug")))),
        value(9, alt((tag_no_case("september"), tag_no_case("sep")))),
        value(10, alt((tag_no_case("october"), tag_no_case("oct")))),
        value(11, alt((tag_no_case("november"), tag_no_case("nov")))),
        value(12, alt((tag_no_case("december"), tag_no_case("dec")))),
    ))(input)
}

fn weekday_name(input: &str) -> IResult<&str, Weekday> {
    alt((
        value(
            Weekday::Mon,
            alt((tag_no_case("monday"), tag_no_case("mon"))),
        ),
        value(
            Weekday::Tue,
            alt((tag_no_case("tuesday"), tag_no_case("tue"))),
        ),
        value(
            Weekday::Wed,
            alt((tag_no_case("wednesday"), tag_no_case("wed"))),
        ),
        value(
            Weekday::Thu,
            alt((tag_no_case("thursday"), tag_no_case("thu"))),
        ),
        value(
            Weekday::Fri,
            alt((tag_no_case("friday"), tag_no_case("fri"))),
        ),
        value(
            Weekday::Sat,
            alt((tag_no_case("saturday"), tag_no_case("sat"))),
        ),
        value(
            Weekday::Sun,
            alt((tag_no_case("sunday"), tag_no_case("sun"))),
        ),
    ))(input)
}

fn iso_date(input: &str) -> IResult<&str, NaiveDate> {
    let (input, (year, _, month, _, day)) =
        tuple((parse_u32, char('-'), parse_u32, char('-'), parse_u32))(input)?;
    match NaiveDate::from_ymd_opt(year as i32, month, day) {
        Some(date) => Ok((input, date)),
        None => Err(nom::Err::Error(nom::error::Error::new(
            input,
            nom::error::ErrorKind::Verify,
        ))),
    }
}

fn numeric_date(input: &str) -> IResult<&str, (u32, u32, Option<u32>)> {
    let (input, day) = parse_u32(input)?;
    let (input, _) = char('/')(input)?;
    let (input, month) = parse_u32(input)?;
    let (input, year) = opt(preceded(char('/'), parse_u32))(input)?;
    Ok((input, (day, month, year)))
}

fn named_date_month_first(input: &str) -> IResult<&str, (u32, u32)> {
    let (input, month) = month_name(input)?;
    let (input, _) = space1(input)?;
    let (input, day) = parse_u32(input)?;
    Ok((input, (day, month)))
}

fn named_date_day_first(input: &str) -> IResult<&str, (u32, u32)> {
    let (input, day) = parse_u32(input)?;
    let (input, _) = space1(input)?;
    let (input, month) = month_name(input)?;
    Ok((input, (day, month)))
}

fn relative_today(input: &str) -> IResult<&str, RelativeDate> {
    value(RelativeDate::Today, tag_no_case("today"))(input)
}

fn relative_tomorrow(input: &str) -> IResult<&str, RelativeDate> {
    value(RelativeDate::Tomorrow, tag_no_case("tomorrow"))(input)
}

fn weekday_ref(input: &str) -> IResult<&str, RelativeDate> {
    alt((
        map(preceded(tag_no_case("next "), weekday_name), |day| {
            RelativeDate::Weekday {
                day: weekday_to_string(day),
                next: true,
            }
        }),
        map(preceded(tag_no_case("this "), weekday_name), |day| {
            RelativeDate::Weekday {
                day: weekday_to_string(day),
                next: false,
            }
        }),
        map(weekday_name, |day| RelativeDate::Weekday {
            day: weekday_to_string(day),
            next: false,
        }),
    ))(input)
}

fn weekday_to_string(day: Weekday) -> String {
    match day {
        Weekday::Mon => "monday".to_string(),
        Weekday::Tue => "tuesday".to_string(),
        Weekday::Wed => "wednesday".to_string(),
        Weekday::Thu => "thursday".to_string(),
        Weekday::Fri => "friday".to_string(),
        Weekday::Sat => "saturday".to_string(),
        Weekday::Sun => "sunday".to_string(),
    }
}

pub fn parse_date(input: &str, year: i32) -> IResult<&str, DateSpec> {
    alt((
        map(iso_date, DateSpec::Single),
        map(numeric_date, |(day, month, opt_year)| {
            let y = opt_year.map(|y| y as i32).unwrap_or(year);
            DateSpec::Single(NaiveDate::from_ymd_opt(y, month, day).unwrap_or_default())
        }),
        map(named_date_month_first, |(day, month)| {
            DateSpec::Single(NaiveDate::from_ymd_opt(year, month, day).unwrap_or_default())
        }),
        map(named_date_day_first, |(day, month)| {
            DateSpec::Single(NaiveDate::from_ymd_opt(year, month, day).unwrap_or_default())
        }),
        map(parse_u32, |day| {
            DateSpec::Single(NaiveDate::from_ymd_opt(year, 1, day).unwrap_or_default())
        }),
        map(relative_today, DateSpec::Relative),
        map(relative_tomorrow, DateSpec::Relative),
        map(weekday_ref, DateSpec::Relative),
    ))(input)
}

pub fn parse_date_range(input: &str, year: i32) -> IResult<&str, DateSpec> {
    // First, try to parse "3-17 Apr" format (day range followed by month)
    if let Ok((remaining, date_spec)) = parse_day_range_with_trailing_month(input, year) {
        return Ok((remaining, date_spec));
    }

    let (remaining, start) = parse_date(input, year)?;

    // Try to parse a range suffix like "-17", "- 17", " - jan 20", etc.
    // First, skip optional whitespace before the hyphen
    let remaining = remaining.trim_start();

    if let Ok((remaining2, _)) = char::<&str, nom::error::Error<&str>>('-')(remaining) {
        // Skip optional whitespace after the hyphen
        let remaining2 = remaining2.trim_start();

        // Try to parse end as a full date first
        if let Ok((remaining3, end)) = parse_date(remaining2, year) {
            if let (DateSpec::Single(start_date), DateSpec::Single(end_date)) = (&start, &end) {
                return Ok((
                    remaining3,
                    DateSpec::Range {
                        start: *start_date,
                        end: *end_date,
                    },
                ));
            }
        }
        // Try to parse as just a day number
        if let Ok((remaining3, end_day)) = parse_u32(remaining2) {
            if let DateSpec::Single(start_date) = &start {
                let end_date = NaiveDate::from_ymd_opt(year, start_date.month(), end_day)
                    .unwrap_or(*start_date);
                return Ok((
                    remaining3,
                    DateSpec::Range {
                        start: *start_date,
                        end: end_date,
                    },
                ));
            }
        }
    }

    Ok((remaining, start))
}

/// Parse "3-17 Apr" format: day range followed by month name
fn parse_day_range_with_trailing_month(input: &str, year: i32) -> IResult<&str, DateSpec> {
    // Parse start day
    let (remaining, start_day) = parse_u32(input)?;

    // Skip optional whitespace before hyphen
    let remaining = remaining.trim_start();

    // Require hyphen
    let (remaining, _) = char::<&str, nom::error::Error<&str>>('-')(remaining)?;

    // Skip optional whitespace after hyphen
    let remaining = remaining.trim_start();

    // Parse end day
    let (remaining, end_day) = parse_u32(remaining)?;

    // Require whitespace before month
    let (remaining, _) = space1(remaining)?;

    // Parse month name
    let (remaining, month) = month_name(remaining)?;

    // Build the dates
    let start_date = NaiveDate::from_ymd_opt(year, month, start_day).ok_or_else(|| {
        nom::Err::Error(nom::error::Error::new(input, nom::error::ErrorKind::Verify))
    })?;
    let end_date = NaiveDate::from_ymd_opt(year, month, end_day).ok_or_else(|| {
        nom::Err::Error(nom::error::Error::new(input, nom::error::ErrorKind::Verify))
    })?;

    Ok((
        remaining,
        DateSpec::Range {
            start: start_date,
            end: end_date,
        },
    ))
}

pub fn parse_month_header(input: &str) -> Option<String> {
    let months = [
        "january",
        "february",
        "march",
        "april",
        "may",
        "june",
        "july",
        "august",
        "september",
        "october",
        "november",
        "december",
    ];

    let lower = input.to_lowercase();
    for month in months {
        if lower.starts_with(month) {
            return Some(month.to_string());
        }
    }
    None
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_iso_date() {
        let (_, date) = iso_date("2026-01-15").unwrap();
        assert_eq!(date, NaiveDate::from_ymd_opt(2026, 1, 15).unwrap());
    }

    #[test]
    fn test_named_date() {
        let (_, (day, month)) = named_date_month_first("jan 15").unwrap();
        assert_eq!(day, 15);
        assert_eq!(month, 1);
    }

    #[test]
    fn test_numeric_date() {
        let (_, (day, month, year)) = numeric_date("15/1/2026").unwrap();
        assert_eq!(day, 15);
        assert_eq!(month, 1);
        assert_eq!(year, Some(2026));
    }

    #[test]
    fn test_weekday() {
        let (_, day) = weekday_name("monday").unwrap();
        assert_eq!(day, Weekday::Mon);
    }

    #[test]
    fn test_date_range() {
        let (_, date) = parse_date_range("jan 15-17", 2026).unwrap();
        match date {
            DateSpec::Range { start, end } => {
                assert_eq!(start, NaiveDate::from_ymd_opt(2026, 1, 15).unwrap());
                assert_eq!(end, NaiveDate::from_ymd_opt(2026, 1, 17).unwrap());
            }
            _ => panic!("Expected range"),
        }
    }

    #[test]
    fn test_date_range_with_spaces() {
        // Test "apr 4 - may 10" format (spaces around hyphen)
        let (remaining, date) = parse_date_range("apr 4 - may 10: Holiday", 2026).unwrap();
        assert_eq!(remaining, ": Holiday");
        match date {
            DateSpec::Range { start, end } => {
                assert_eq!(start, NaiveDate::from_ymd_opt(2026, 4, 4).unwrap());
                assert_eq!(end, NaiveDate::from_ymd_opt(2026, 5, 10).unwrap());
            }
            _ => panic!("Expected range"),
        }
    }

    #[test]
    fn test_date_range_cross_month() {
        // Test cross-month range without spaces
        let (_, date) = parse_date_range("apr 4-may 10", 2026).unwrap();
        match date {
            DateSpec::Range { start, end } => {
                assert_eq!(start, NaiveDate::from_ymd_opt(2026, 4, 4).unwrap());
                assert_eq!(end, NaiveDate::from_ymd_opt(2026, 5, 10).unwrap());
            }
            _ => panic!("Expected range"),
        }
    }

    #[test]
    fn test_date_range_day_first_with_trailing_month() {
        // Test "3-17 Apr" format (day range followed by month)
        let (remaining, date) = parse_date_range("3-17 Apr: Autumn school holidays", 2026).unwrap();
        assert_eq!(remaining, ": Autumn school holidays");
        match date {
            DateSpec::Range { start, end } => {
                assert_eq!(start, NaiveDate::from_ymd_opt(2026, 4, 3).unwrap());
                assert_eq!(end, NaiveDate::from_ymd_opt(2026, 4, 17).unwrap());
            }
            _ => panic!("Expected range"),
        }
    }

    #[test]
    fn test_date_range_day_first_with_spaces() {
        // Test "3 - 17 Apr" format with spaces around hyphen
        let (_, date) = parse_date_range("3 - 17 Apr", 2026).unwrap();
        match date {
            DateSpec::Range { start, end } => {
                assert_eq!(start, NaiveDate::from_ymd_opt(2026, 4, 3).unwrap());
                assert_eq!(end, NaiveDate::from_ymd_opt(2026, 4, 17).unwrap());
            }
            _ => panic!("Expected range"),
        }
    }
}
