
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CourseService } from '../course.service';
import { CourseResponse, SaveCourseRequest } from '../course.models';

@Component({
  selector: 'app-course-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './course-list.html',
  styleUrl: './course-list.css',
})
export class CourseListComponent implements OnInit {
  private courseService = inject(CourseService);

  // Add Course Form
  showAddCourseForm = signal(false);

  newCourse = signal<SaveCourseRequest>({
    courseName: '',
    duration: '',
    fees: 0,
    capacity: 1,
    isActive: true,
  });

  // Edit Course Form
  showEditCourseForm = signal(false);
  selectedCourseId = signal<number | null>(null);

  editCourse = signal<SaveCourseRequest>({
    courseName: '',
    duration: '',
    fees: 0,
    capacity: 1,
    isActive: true,
  });

  // Course Signals
  courses = signal<CourseResponse[]>([]);

  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  pageNumber = signal(1);
  pageSize = signal(10);

  totalRecords = signal(0);
  totalPages = signal(0);

  ngOnInit(): void {
    this.loadCourses();
  }

  // Open Add Course Form
  openAddCourse(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
    this.showAddCourseForm.set(true);
  }

  // Close Add Course Form
  closeAddCourse(): void {
    this.showAddCourseForm.set(false);
  }

  // Save New Course
  saveCourse(): void {
    const course = this.newCourse();

    if (!this.isValidCourse(course)) {
      this.errorMessage.set('Please enter valid course details.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.courseService.createCourse(course).subscribe({
      next: () => {
        this.newCourse.set({
          courseName: '',
          duration: '',
          fees: 0,
          capacity: 1,
          isActive: true,
        });

        this.closeAddCourse();
        this.successMessage.set('Course created successfully.');
        this.pageNumber.set(1);
        this.loadCourses();
      },
      error: (error) => {
        console.error('Course creation failed:', error);
        this.errorMessage.set('Unable to create course.');
        this.isLoading.set(false);
      },
    });
  }

  // Open Edit Course Form
  openEditCourse(course: CourseResponse): void {
    this.errorMessage.set('');
    this.successMessage.set('');
    this.selectedCourseId.set(course.courseId);

    this.editCourse.set({
      courseName: course.courseName,
      duration: course.duration,
      fees: course.fees,
      capacity: course.capacity,
      isActive: course.isActive,
    });

    this.showEditCourseForm.set(true);
  }

  // Close Edit Course Form
  closeEditCourse(): void {
    this.showEditCourseForm.set(false);
    this.selectedCourseId.set(null);
  }

  // Update Existing Course
  updateCourse(): void {
    const id = this.selectedCourseId();
    const course = this.editCourse();

    if (id === null) {
      this.errorMessage.set('Invalid course selected.');
      return;
    }

    if (!this.isValidCourse(course)) {
      this.errorMessage.set('Please enter valid course details.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.courseService.updateCourse(id, course).subscribe({
      next: () => {
        this.closeEditCourse();
        this.successMessage.set('Course updated successfully.');
        this.loadCourses();
      },
      error: (error) => {
        console.error('Course update failed:', error);
        this.errorMessage.set(
          error.error?.message || 'Unable to update course.'
        );
        this.isLoading.set(false);
      },
    });
  }

  // Deactivate Course
  deactivateCourse(course: CourseResponse): void {
    if (!confirm(`Are you sure you want to deactivate "${course.courseName}"?`)) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.courseService.deactivateCourse(course.courseId).subscribe({
      next: () => {
        this.successMessage.set('Course deactivated successfully.');
        this.loadCourses();
      },
      error: (error) => {
        console.error('Course deactivation failed:', error);
        this.errorMessage.set('Unable to deactivate course.');
        this.isLoading.set(false);
      },
    });
  }

  // Activate Course
  activateCourse(course: CourseResponse): void {
    if (!confirm(`Are you sure you want to activate "${course.courseName}"?`)) {
      return;
    }

    const request: SaveCourseRequest = {
      courseName: course.courseName,
      duration: course.duration,
      fees: course.fees,
      capacity: course.capacity,
      isActive: true,
    };

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.courseService.updateCourse(course.courseId, request).subscribe({
      next: () => {
        this.successMessage.set('Course activated successfully.');
        this.loadCourses();
      },
      error: (error) => {
        console.error('Course activation failed:', error);
        this.errorMessage.set('Unable to activate course.');
        this.isLoading.set(false);
      },
    });
  }

  // Validate Course Details
  private isValidCourse(course: SaveCourseRequest): boolean {
    return (
      !!course.courseName.trim() &&
      !!course.duration.trim() &&
      Number.isFinite(course.fees) &&
      course.fees > 0 &&
      Number.isInteger(course.capacity) &&
      course.capacity > 0
    );
  }

  // Load Courses
  loadCourses(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.courseService
      .getCourses(this.pageNumber(), this.pageSize())
      .subscribe({
        next: (response) => {
          this.courses.set(response.items);
          this.totalRecords.set(response.totalRecords);
          this.totalPages.set(response.totalPages);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading courses:', error);
          this.errorMessage.set('Unable to load courses.');
          this.isLoading.set(false);
        },
      });
  }

  // Navigate to Next Page
  nextPage(): void {
    if (this.pageNumber() < this.totalPages()) {
      this.pageNumber.update((page) => page + 1);
      this.loadCourses();
    }
  }

  // Navigate to Previous Page
  previousPage(): void {
    if (this.pageNumber() > 1) {
      this.pageNumber.update((page) => page - 1);
      this.loadCourses();
    }
  }
}
