import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudentService } from '../../admin/students/student.service';
import { StudentResponse, UpdateStudentRequest } from '../../admin/students/student.models';

@Component({
  selector: 'app-student-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class StudentProfile implements OnInit {
  private studentService = inject(StudentService);
private cdr = inject(ChangeDetectorRef);

  profile: StudentResponse | null = null;

  isLoading = false;
  isSaving = false;
  errorMessage = '';
  successMessage = '';
  isEditing = false;

  formData: UpdateStudentRequest = {
    name: '',
    department: '',
    age: 17,
    cgpa: 0,
  };

  ngOnInit(): void {
    this.loadProfile();
  }

  
loadProfile(): void {
  this.isLoading = true;
  this.errorMessage = '';

  this.studentService.getMyProfile().subscribe({
    next: (response) => {
      this.profile = response;

      this.formData = {
        name: response.name,
        department: response.department,
        age: response.age,
        cgpa: response.cgpa,
      };

      this.isLoading = false;
      this.cdr.detectChanges();
    },
    error: (error) => {
      this.errorMessage = 'Unable to load your profile.';
      this.isLoading = false;
      this.cdr.detectChanges();
    },
  });
}


  enableEdit(): void {
    if (!this.profile) return;

    this.formData = {
      name: this.profile.name,
      department: this.profile.department,
      age: this.profile.age,
      cgpa: this.profile.cgpa,
    };

    this.isEditing = true;
    this.successMessage = '';
    this.errorMessage = '';
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.loadProfile();
  }

  updateProfile(): void {
    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.studentService.updateMyProfile(this.formData).subscribe({
      next: (response) => {
        this.profile = response;
        this.isEditing = false;
        this.isSaving = false;
        this.successMessage = 'Profile updated successfully!';
      },
      error: () => {
        this.errorMessage = 'Unable to update your profile.';
        this.isSaving = false;
      },
    });
  }
}
