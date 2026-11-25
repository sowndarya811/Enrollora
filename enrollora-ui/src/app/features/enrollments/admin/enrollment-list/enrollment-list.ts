
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EnrollmentService } from '../../enrollment.service';
import { CourseService } from '../../../admin/courses/course.service';
import { CourseResponse } from '../../../admin/courses/course.models';

import {
  EnrollmentResponse,
  EnrollmentFilter,
} from '../../enrollment.models';

@Component({
  selector: 'app-enrollment-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './enrollment-list.html',
  styleUrl: './enrollment-list.css',
})
export class EnrollmentListComponent implements OnInit {
  private readonly enrollmentService = inject(EnrollmentService);
  private readonly courseService = inject(CourseService);

  courses = signal<CourseResponse[]>([]);
  enrollments = signal<EnrollmentResponse[]>([]);

  isLoading = signal(false);
  errorMessage = signal('');

  pageNumber = signal(1);
  pageSize = signal(10);
  totalRecords = signal(0);
  totalPages = signal(0);

  // Filter fields
  searchTerm = signal('');
  courseIdFilter = signal<number | null>(null);
  statusFilter = signal<number | null>(null);
  fromDateFilter = signal('');
  toDateFilter = signal('');

  // Applied filters
  private appliedFilters: EnrollmentFilter = {};

  ngOnInit(): void {
    this.loadCourses();
    this.loadEnrollments();
  }

  // Load courses for filter dropdown
  loadCourses(): void {
    this.courseService.getCourses(1, 100).subscribe({
      next: (response) => {
        this.courses.set(response.items ?? []);
      },
      error: (error) => {
        console.error('Error loading courses:', error);
      },
    });
  }

  // Load all enrollments (Admin)
  loadEnrollments(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.enrollmentService
      .getEnrollments(
        this.pageNumber(),
        this.pageSize(),
        this.appliedFilters
      )
      .subscribe({
        next: (response) => {
          const items = response.items ?? [];

          this.enrollments.set(items);
          this.totalRecords.set(response.totalRecords ?? items.length);
          this.totalPages.set(response.totalPages ?? 1);

          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading enrollments:', error);

          this.enrollments.set([]);
          this.totalRecords.set(0);
          this.totalPages.set(0);

          this.errorMessage.set('Unable to load enrollments.');
          this.isLoading.set(false);
        },
      });
  }

  // Apply filters
  applyFilters(): void {
    const fromDate = this.fromDateFilter();
    const toDate = this.toDateFilter();

    if (fromDate && toDate && fromDate > toDate) {
      this.errorMessage.set(
        'From Date cannot be later than To Date.'
      );
      return;
    }

    this.appliedFilters = {
      search: this.searchTerm().trim() || undefined,
      courseId: this.courseIdFilter(),
      status: this.statusFilter(),
      fromDate: fromDate
        ? `${fromDate}T00:00:00`
        : undefined,
      toDate: toDate
        ? `${toDate}T23:59:59.999`
        : undefined,
    };

    this.pageNumber.set(1);
    this.loadEnrollments();
  }

  // Clear filters
  clearFilters(): void {
    this.searchTerm.set('');
    this.courseIdFilter.set(null);
    this.statusFilter.set(null);
    this.fromDateFilter.set('');
    this.toDateFilter.set('');

    this.appliedFilters = {};

    this.pageNumber.set(1);
    this.loadEnrollments();
  }

  // Next page
  nextPage(): void {
    if (this.pageNumber() < this.totalPages()) {
      this.pageNumber.update((page) => page + 1);
      this.loadEnrollments();
    }
  }

  // Previous page
  previousPage(): void {
    if (this.pageNumber() > 1) {
      this.pageNumber.update((page) => page - 1);
      this.loadEnrollments();
    }
  }
}
