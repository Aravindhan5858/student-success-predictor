import uuid
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_active_user
from app.models.user import User, UserRole
from app.models.audit import File as FileModel
from app.services.cloudinary_service import upload_file, delete_file

router = APIRouter()


@router.post("/upload", status_code=201)
async def upload(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    result = await upload_file(file, folder="student-success")
    db_file = FileModel(
        user_id=current_user.id,
        filename=file.filename,
        original_name=file.filename,
        cloudinary_url=result["url"],
        cloudinary_public_id=result["public_id"],
        file_type=file.content_type,
        size=file.size,
    )
    db.add(db_file)
    db.commit()
    db.refresh(db_file)
    return {"id": str(db_file.id), "url": db_file.cloudinary_url, "filename": db_file.original_name}


@router.delete("/{file_id}", status_code=204)
def delete(file_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    db_file = db.query(FileModel).filter(FileModel.id == file_id).first()
    if not db_file:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
    if db_file.user_id != current_user.id and current_user.role != UserRole.admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    if db_file.cloudinary_public_id:
        delete_file(db_file.cloudinary_public_id)
    db.delete(db_file)
    db.commit()


@router.get("/me")
def my_files(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    files = db.query(FileModel).filter(FileModel.user_id == current_user.id).all()
    return [{"id": str(f.id), "filename": f.original_name, "url": f.cloudinary_url, "created_at": f.created_at.isoformat()} for f in files]
