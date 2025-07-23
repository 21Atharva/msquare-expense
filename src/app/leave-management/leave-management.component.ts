import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { BusinessDataService } from 'src/app/services/business-data.service';
import { AlertBoxComponent } from 'src/app/shared/alert-box/alert-box.component';
import { LeaveApplication } from '../admin-dashboard/admin-dashboard.component';
import { ProfileComponent } from '../shared/profile/profile.component';

@Component({
  selector: 'app-leave-management',
  templateUrl: './leave-management.component.html',
  styleUrls: ['./leave-management.component.scss']
})
export class LeaveManagementComponent implements OnInit {
  dataSource: LeaveApplication[] = [];
  originalDataSource: LeaveApplication[] = [];
  displayedColumns: string[] = [
    'employeeName', 'dateRange', 'totalDays', 'status'
  ];

  isExpanded = false;
  totalCount = 0;
  pendingCount = 0;
  approvedCount = 0;
  rejectedCount = 0;

  pageSize = 6;
  pageIndex = 0;
  pagedLeaves: LeaveApplication[] = [];

  userRole = '';
  searchQuery: string = '';

  // Date filter properties
  fromDate: Date | null = null;
  toDate: Date | null = null;
  filteredLeaves: LeaveApplication[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    public dialog: MatDialog,
    private route: Router,
    private snackBar: MatSnackBar,
    private businessData: BusinessDataService
  ) {}

  ngOnInit(): void {
    this.userRole = localStorage.getItem('role') || '';
    this.loadAllLeaves();
  }

  loadAllLeaves(): void {
    const userRole = (localStorage.getItem('role') || '').trim();
    const userId = localStorage.getItem('Id');

    if (!userId) {
      console.error('User ID not found in localStorage.');
      return;
    }

    if (userRole === 'admin') {
      this.businessData.getAllLeaves().subscribe({
        next: (leaves) => {
          this.originalDataSource = leaves;
          this.dataSource = [...leaves];
          this.filteredLeaves = [...leaves];
          this.updatePagedLeaves();
          this.calculateStatusCounts();
        },
        error: (error) => {
          console.error('Error loading leave applications:', error);
          this.dialog.open(AlertBoxComponent, {
            width: '300px',
            data: { message: 'Failed to load leave applications.', type: 'error' }
          });
        }
      });
    } else if (userRole === 'manager') {
      this.businessData.getUserById(userId).subscribe({
        next: (user: any) => {
          const department = (user?.department || '').trim();
          if (!department) {
            console.error('Department not found for manager.');
            return;
          }

          this.businessData.getLeavesByDepartment(department).subscribe({
            next: (leaves) => {
              this.originalDataSource = leaves;
              this.dataSource = [...leaves];
              this.filteredLeaves = [...leaves];
              this.updatePagedLeaves();
              this.calculateStatusCounts();
            },
            error: (error) => {
              console.error('Error loading leaves by department:', error);
            }
          });
        },
        error: (err) => {
          console.error('Error fetching manager data:', err);
        }
      });
    }
  }

  calculateStatusCounts(): void {
    this.pendingCount = this.dataSource.filter(leave => leave.status?.toLowerCase() === 'pending').length;
    this.approvedCount = this.dataSource.filter(leave => leave.status?.toLowerCase() === 'approved').length;
    this.rejectedCount = this.dataSource.filter(leave => leave.status?.toLowerCase() === 'rejected').length;
    this.totalCount = this.pendingCount + this.approvedCount + this.rejectedCount;
  }

  updatePagedLeaves(): void {
    const start = this.pageIndex * this.pageSize;
    const end = start + this.pageSize;
    this.pagedLeaves = this.dataSource.slice(start, end);
  }

  pageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePagedLeaves();
  }

  applyFilter(event: Event): void {
    this.searchQuery = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.applyFilters();
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.applyFilters();
  }

  updateStatus(leaveId: string, status: string): void {
    this.businessData.updateLeaveStatus(leaveId, status).subscribe({
      next: () => {
        this.dialog.open(AlertBoxComponent, {
          data: { type: 'success', message: `Leave status updated to ${status}` }
        });
        this.loadAllLeaves();
      },
      error: (error) => {
        console.error('Failed to update status', error);
        this.dialog.open(AlertBoxComponent, {
          data: { type: 'error', message: 'Failed to update leave status' }
        });
      }
    });
  }

  // Navigation methods (unchanged)
  openDialog(): void {
    this.dialog.open(ProfileComponent, { width: '100px' });
  }

  onView(): void {
    this.route.navigate(['dashboard']);
  }

  onProfile(): void {
    this.dialog.open(ProfileComponent, {
      width: '600px',
    });
  }

  onLogout(): void {
    this.dialog.open(AlertBoxComponent, { data: { type: 'alert' } });
  }

  onLeaveApplication(): void {
    this.businessData.onNavigate('leave-management');
  }

  onEmpDashboard(): void {
    this.businessData.onNavigate('emp-dashboard');
  }

  addLeaveApplication(): void {
    this.businessData.onNavigate('leave-application');
  }

  onAdminDashboard(): void {
    this.businessData.onNavigate('admin-dashboard');
  }

  onAdd(): void {
    this.businessData.onNavigate('home');
  }

  getInitials(name: string): string {
    if (!name) return '';
    const nameParts = name.split(' ');
    if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase();
    }
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  }

  // Date filter methods
  onDateFilterChange(): void {
    this.applyFilters();
  }

  clearDateFilter(): void {
    this.fromDate = null;
    this.toDate = null;
    this.applyFilters();
  }

  applyFilters(): void {
    let filteredData = [...this.originalDataSource];

    // Apply date filter
    if (this.fromDate || this.toDate) {
      filteredData = this.filterLeavesByDate(filteredData);
    }

    // Apply search filter
    if (this.searchQuery) {
      const filterValue = this.searchQuery.toLowerCase();
      filteredData = filteredData.filter(leave =>
        leave.employeeName.toLowerCase().includes(filterValue) ||
        leave.employeeId?.toLowerCase().includes(filterValue) ||
        leave.leaveType.toLowerCase().includes(filterValue) ||
        leave.status.toLowerCase().includes(filterValue)
      );
    }

    this.dataSource = filteredData;
    this.pageIndex = 0;
    this.updatePagedLeaves();
    this.calculateStatusCounts();
  }

  filterLeavesByDate(leaves: LeaveApplication[]): LeaveApplication[] {
    if (!this.fromDate && !this.toDate) {
      return leaves;
    }

    return leaves.filter(leave => {
      const leaveStartDate = new Date(leave.startDate);
      const leaveEndDate = new Date(leave.endDate);
      
      // Reset time to start of day for accurate comparison
      leaveStartDate.setHours(0, 0, 0, 0);
      leaveEndDate.setHours(23, 59, 59, 999);

      if (this.fromDate && this.toDate) {
        const fromDate = new Date(this.fromDate);
        const toDate = new Date(this.toDate);
        fromDate.setHours(0, 0, 0, 0);
        toDate.setHours(23, 59, 59, 999);
        
        // Check if leave period overlaps with filter date range
        return (leaveStartDate <= toDate && leaveEndDate >= fromDate);
      } else if (this.fromDate) {
        const fromDate = new Date(this.fromDate);
        fromDate.setHours(0, 0, 0, 0);
        return leaveEndDate >= fromDate;
      } else if (this.toDate) {
        const toDate = new Date(this.toDate);
        toDate.setHours(23, 59, 59, 999);
        return leaveStartDate <= toDate;
      }
      return true;
    });
  }
}
