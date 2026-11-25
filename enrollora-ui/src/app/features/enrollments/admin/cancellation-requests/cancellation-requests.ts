
import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { EnrollmentService } from '../../enrollment.service';
import {
  CancellationResponse,
} from '../../enrollment.models';

@Component({
  selector: 'app-cancellation-requests',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './cancellation-requests.html',
  styleUrl: './cancellation-requests.css',
})
export class CancellationRequests implements OnInit {
  private readonly enrollmentService = inject(EnrollmentService);

  requests = signal<CancellationResponse[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  searchTerm = signal('');
  statusFilter = signal<number | null>(null);
  fromDateFilter = signal('');
  toDateFilter = signal('');

  pageNumber = signal(1);
  pageSize = 10;
  totalRecords = signal(0);
  totalPages = signal(1);

  selectedRequest = signal<CancellationResponse | null>(null);
  adminRemarks = signal('');
  isSubmitting = signal(false);

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.enrollmentService
      .getCancellationRequests(this.pageNumber(), this.pageSize, {
        search: this.searchTerm().trim() || undefined,
        status: this.statusFilter(),
        fromDate: this.fromDateFilter() || undefined,
        toDate: this.toDateFilter() || undefined,
      })
      .subscribe({
        next: (result) => {
          this.requests.set(result.items);
          this.totalRecords.set(result.totalRecords);
          this.totalPages.set(Math.max(1, result.totalPages));
          this.isLoading.set(false);
        },
        error: (error) => {
          this.errorMessage.set(
            error.error?.message || 'Unable to load cancellation requests.',
          );
          this.isLoading.set(false);
        },
      });
  }

  applyFilters(): void {
    if (
      this.fromDateFilter() &&
      this.toDateFilter() &&
      this.fromDateFilter() > this.toDateFilter()
    ) {
      this.errorMessage.set('From date cannot be later than To date.');
      return;
    }

    this.pageNumber.set(1);
    this.loadRequests();
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.statusFilter.set(null);
    this.fromDateFilter.set('');
    this.toDateFilter.set('');
    this.pageNumber.set(1);
    this.loadRequests();
  }

  previousPage(): void {
    if (this.pageNumber() > 1) {
      this.pageNumber.update((page) => page - 1);
      this.loadRequests();
    }
  }

  nextPage(): void {
    if (this.pageNumber() < this.totalPages()) {
      this.pageNumber.update((page) => page + 1);
      this.loadRequests();
    }
  }

  openReview(request: CancellationResponse): void {
    if (request.status !== 0) {
      return;
    }

    this.selectedRequest.set(request);
    this.adminRemarks.set('');
    this.successMessage.set('');
    this.errorMessage.set('');
  }

  closeReview(): void {
    if (!this.isSubmitting()) {
      this.selectedRequest.set(null);
      this.adminRemarks.set('');
    }
  }

  reviewRequest(approve: boolean): void {
    const request = this.selectedRequest();

    if (!request || this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const review = {
      adminRemarks: this.adminRemarks().trim() || undefined,
    };

    const action = approve
      ? this.enrollmentService.approveCancellation(
          request.cancellationRequestId,
          review,
        )
      : this.enrollmentService.rejectCancellation(
          request.cancellationRequestId,
          review,
        );

    action.subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.selectedRequest.set(null);
        this.adminRemarks.set('');
        this.successMessage.set(
          approve
            ? 'Cancellation request approved successfully.'
            : 'Cancellation request rejected successfully.',
        );
        this.loadRequests();
      },
      error: (error) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(
          error.error?.message || 'Unable to review this request.',
        );
      },
    });
  }

  statusLabel(status: number): string {
    switch (status) {
      case 0:
        return 'Pending';
      case 1:
        return 'Approved';
      case 2:
        return 'Rejected';
      default:
        return 'Unknown';
    }
  }
}
