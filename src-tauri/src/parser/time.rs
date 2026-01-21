use chrono::{NaiveTime, Timelike};
use nom::{
    branch::alt,
    bytes::complete::{tag, tag_no_case},
    character::complete::{char, digit1, space0, space1},
    combinator::{map, map_res, opt, value},
    sequence::{preceded, tuple},
    IResult,
};

use super::{FuzzyTime, TimeSpec};

fn parse_u32(input: &str) -> IResult<&str, u32> {
    map_res(digit1, |s: &str| s.parse::<u32>())(input)
}

fn time_12h(input: &str) -> IResult<&str, NaiveTime> {
    let (input, hour) = parse_u32(input)?;
    let (input, minute) = opt(preceded(char(':'), parse_u32))(input)?;
    let (input, meridiem) = alt((tag_no_case("am"), tag_no_case("pm")))(input)?;

    let hour = hour as u32;
    let minute = minute.unwrap_or(0);
    let is_pm = meridiem.to_lowercase() == "pm";

    let hour = match (hour, is_pm) {
        (12, false) => 0,
        (12, true) => 12,
        (h, true) => h + 12,
        (h, false) => h,
    };

    match NaiveTime::from_hms_opt(hour, minute, 0) {
        Some(time) => Ok((input, time)),
        None => Err(nom::Err::Error(nom::error::Error::new(
            input,
            nom::error::ErrorKind::Verify,
        ))),
    }
}

fn time_24h(input: &str) -> IResult<&str, NaiveTime> {
    let (input, hour) = parse_u32(input)?;
    let (input, _) = char(':')(input)?;
    let (input, minute) = parse_u32(input)?;

    match NaiveTime::from_hms_opt(hour, minute, 0) {
        Some(time) => Ok((input, time)),
        None => Err(nom::Err::Error(nom::error::Error::new(
            input,
            nom::error::ErrorKind::Verify,
        ))),
    }
}

fn fuzzy_time(input: &str) -> IResult<&str, FuzzyTime> {
    alt((
        value(FuzzyTime::Morning, tag_no_case("morning")),
        value(FuzzyTime::Afternoon, tag_no_case("afternoon")),
        value(FuzzyTime::Evening, tag_no_case("evening")),
        value(FuzzyTime::Night, tag_no_case("night")),
    ))(input)
}

fn time_point(input: &str) -> IResult<&str, NaiveTime> {
    alt((time_12h, time_24h))(input)
}

fn time_range(input: &str) -> IResult<&str, (NaiveTime, NaiveTime)> {
    let (input, start) = time_point(input)?;
    let (input, _) = char('-')(input)?;
    let (input, end) = time_point(input)?;
    Ok((input, (start, end)))
}

fn duration(input: &str) -> IResult<&str, u32> {
    let (input, num) = parse_u32(input)?;
    let (input, unit) = alt((
        value(60, alt((tag("h"), tag("hr")))),
        value(1, alt((tag("m"), tag("min")))),
    ))(input)?;
    Ok((input, num * unit))
}

fn time_with_duration(input: &str) -> IResult<&str, (NaiveTime, NaiveTime)> {
    let (input, start) = time_point(input)?;
    let (input, _) = space1(input)?;
    let (input, dur_mins) = duration(input)?;

    let end_mins = start.num_seconds_from_midnight() / 60 + dur_mins;
    let end_hour = (end_mins / 60) % 24;
    let end_min = end_mins % 60;

    let end = NaiveTime::from_hms_opt(end_hour, end_min, 0).unwrap_or(start);
    Ok((input, (start, end)))
}

pub fn parse_time(input: &str) -> IResult<&str, TimeSpec> {
    alt((
        map(time_range, |(start, end)| TimeSpec::Range {
            start: format_time(start),
            end: format_time(end),
        }),
        map(time_with_duration, |(start, end)| TimeSpec::Range {
            start: format_time(start),
            end: format_time(end),
        }),
        map(fuzzy_time, TimeSpec::Fuzzy),
        map(time_point, |t| TimeSpec::Point(format_time(t))),
    ))(input)
}

fn format_time(time: NaiveTime) -> String {
    time.format("%H:%M").to_string()
}

pub fn fuzzy_to_time(fuzzy: &FuzzyTime) -> NaiveTime {
    match fuzzy {
        FuzzyTime::Morning => NaiveTime::from_hms_opt(9, 0, 0).unwrap(),
        FuzzyTime::Afternoon => NaiveTime::from_hms_opt(14, 0, 0).unwrap(),
        FuzzyTime::Evening => NaiveTime::from_hms_opt(18, 0, 0).unwrap(),
        FuzzyTime::Night => NaiveTime::from_hms_opt(21, 0, 0).unwrap(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_time_12h() {
        let (_, time) = time_12h("9am").unwrap();
        assert_eq!(time, NaiveTime::from_hms_opt(9, 0, 0).unwrap());

        let (_, time) = time_12h("9:30pm").unwrap();
        assert_eq!(time, NaiveTime::from_hms_opt(21, 30, 0).unwrap());

        let (_, time) = time_12h("12pm").unwrap();
        assert_eq!(time, NaiveTime::from_hms_opt(12, 0, 0).unwrap());

        let (_, time) = time_12h("12am").unwrap();
        assert_eq!(time, NaiveTime::from_hms_opt(0, 0, 0).unwrap());
    }

    #[test]
    fn test_time_24h() {
        let (_, time) = time_24h("14:00").unwrap();
        assert_eq!(time, NaiveTime::from_hms_opt(14, 0, 0).unwrap());
    }

    #[test]
    fn test_time_range() {
        let (_, (start, end)) = time_range("9am-5pm").unwrap();
        assert_eq!(start, NaiveTime::from_hms_opt(9, 0, 0).unwrap());
        assert_eq!(end, NaiveTime::from_hms_opt(17, 0, 0).unwrap());
    }

    #[test]
    fn test_fuzzy_time() {
        let (_, fuzzy) = fuzzy_time("morning").unwrap();
        assert!(matches!(fuzzy, FuzzyTime::Morning));
    }

    #[test]
    fn test_duration() {
        let (_, mins) = duration("2h").unwrap();
        assert_eq!(mins, 120);
    }
}
