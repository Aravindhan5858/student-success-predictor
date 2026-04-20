import io
from typing import List, Tuple
import pandas as pd
from fastapi import UploadFile

REQUIRED_COLUMNS = {"student_id", "course_code", "semester", "marks", "attendance"}


def validate_schema(df: pd.DataFrame) -> List[str]:
    missing = REQUIRED_COLUMNS - set(df.columns.str.lower().tolist())
    return [f"Missing column: {col}" for col in missing]


async def parse_academic_csv(file: UploadFile) -> Tuple[List[dict], List[str]]:
    content = await file.read()
    errors: List[str] = []
    records: List[dict] = []

    try:
        df = pd.read_csv(io.BytesIO(content))
    except Exception as e:
        return [], [f"Failed to parse file: {str(e)}"]

    df.columns = df.columns.str.lower().str.strip()
    schema_errors = validate_schema(df)
    if schema_errors:
        return [], schema_errors

    for idx, row in df.iterrows():
        row_num = idx + 2  # 1-indexed + header
        try:
            marks = float(row["marks"])
            attendance = float(row["attendance"])
            if not (0 <= marks <= 100):
                errors.append(f"Row {row_num}: marks must be 0-100")
                continue
            if not (0 <= attendance <= 100):
                errors.append(f"Row {row_num}: attendance must be 0-100")
                continue
            records.append({
                "student_id": str(row["student_id"]).strip(),
                "course_code": str(row["course_code"]).strip(),
                "semester": int(row["semester"]),
                "marks": marks,
                "attendance": attendance,
                "grade": str(row.get("grade", "")).strip() or None,
            })
        except (ValueError, KeyError) as e:
            errors.append(f"Row {row_num}: {str(e)}")

    return records, errors
