
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

  // Course Signals
  courses = signal<CourseResponse[]>([]);

  isLoading = signal(false);
  errorMessage = signal('');

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
    this.showAddCourseForm.set(true);
  }

  // Close Add Course Form
  closeAddCourse(): void {
    this.showAddCourseForm.set(false);
  }

  // Save New Course
  saveCourse(): void {
    const course = this.newCourse();

    if (
      !course.courseName.trim() ||
      !course.duration.trim() ||
      course.fees <= 0 ||
      course.capacity <= 0
    ) {
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
