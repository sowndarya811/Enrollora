
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';

import { EnrollmentResponse } from '../../enrollment.models';
import { EnrollmentService } from '../../enrollment.service';

@Component({
  selector: 'app-my-enrollments',
  standalone: true,
  imports: [CommonModule],
  styleUrl: './my-enrollments.css',
  templateUrl: './my-enrollments.html',
})
export class MyEnrollments implements OnInit {
  private readonly enrollmentService = inject(EnrollmentService);

  enrollments = signal<EnrollmentResponse[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');
  pageNumber = signal(1);
  pageSize = signal(10);
  totalRecords = signal(0);
  totalPages = signal(0);

  selectedEnrollment = signal<EnrollmentResponse | null>(null);
  cancellationReason = signal('');
  isSubmittingCancellation = signal(false);
  cancellationMessage = signal('');
  cancellationError = signal('');
  submittedCancellationIds = signal<number[]>([]);

  ngOnInit(): void {
    this.loadEnrollments();
  }

  loadEnrollments(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.enrollmentService
      .getMyEnrollments(this.pageNumber(), this.pageSize())
      .subscribe({
        next: (response) => {
          this.enrollments.set(response.items);
          this.totalRecords.set(response.totalRecords);
          this.totalPages.set(response.totalPages);
          this.isLoading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          const body = error.error;
          this.errorMessage.set(
            body?.detail || body?.message || body?.title ||
            'Unable to load your enrollments.',
          );
          this.isLoading.set(false);
        },
      });
  }

  statusLabel(status: number): string {
    return status === 0 ? 'Active' : 'Cancelled';
  }

  openCancellationModal(enrollment: EnrollmentResponse): void {
    this.selectedEnrollment.set(enrollment);
    this.cancellationReason.set('');
    this.cancellationError.set('');
    this.cancellationMessage.set('');
  }

  closeCancellationModal(): void {
    if (this.isSubmittingCancellation()) {
      return;
    }

    this.selectedEnrollment.set(null);
    this.cancellationReason.set('');
    this.cancellationError.set('');
  }

  submitCancellationRequest(): void {
    const enrollment = this.selectedEnrollment();
    const reason = this.cancellationReason().trim();

    if (!enrollment) {
      return;
    }

    if (!reason) {
      this.cancellationError.set('Please enter a cancellation reason.');
      return;
    }

    if (reason.length > 1000) {
      this.cancellationError.set(
        'Cancellation reason cannot exceed 1000 characters.',
      );
      return;
    }

    this.isSubmittingCancellation.set(true);
    this.cancellationError.set('');

    this.enrollmentService
      .createCancellationRequest(enrollment.enrollmentId, { reason })
      .subscribe({
        next: () => {
          this.submittedCancellationIds.update((ids) => [
            ...ids,
            enrollment.enrollmentId,
          ]);
          this.cancellationMessage.set(
            'Cancellation request submitted successfully. It is waiting for admin review.',
          );
          this.selectedEnrollment.set(null);
          this.cancellationReason.set('');
          this.isSubmittingCancellation.set(false);
        },
        error: (error: HttpErrorResponse) => {
          const body = error.error;
          this.cancellationError.set(
            body?.detail || body?.message || body?.title ||
            'Unable to submit cancellation request.',
          );
          this.isSubmittingCancellation.set(false);
        },
      });
  }

  previousPage(): void {
    if (this.pageNumber() > 1) {
      this.pageNumber.update((page) => page - 1);
      this.loadEnrollments();
    }
  }

  nextPage(): void {
    if (this.pageNumber() < this.totalPages()) {
      this.pageNumber.update((page) => page + 1);
      this.loadEnrollments();
    }
  }
}
