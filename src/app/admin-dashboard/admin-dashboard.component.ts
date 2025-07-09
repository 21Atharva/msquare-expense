import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { BusinessDataService } from 'src/app/services/business-data.service';
import { AlertBoxComponent } from 'src/app/shared/alert-box/alert-box.component';
import { ProfileComponent } from '../shared/profile/profile.component';

export interface Employee {
  name: string;
  gmail: string;
  status: string;
  userId?: string;
  role?: string;
  mobile?: string;
  id?: string;
}

export interface LeaveApplication {
  leaveId: string;
  employeeId: string;
  employeeName: string;
  leaveType: string;
  emailId: string;
  startDate: string;
  totalDays: string;
  endDate: string;
  status: string;
  reason: string;
  isStartHalfDay?: boolean;
  startHalfDayType?: string;
  isEndHalfDay?: boolean;
  endHalfDayType?: string;
}

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  // Pending Employees
  pendingEmployees: Employee[] = [];
  paginatedEmployees: Employee[] = [];
  filteredEmployees: Employee[] = [];
  pendingPageIndex = 0;
  pendingPageSize = 5;

  // All Employees
  allEmployees: Employee[] = [];
  filteredAllEmployees: Employee[] = [];
  paginatedAllEmployees: Employee[] = [];
  allEmpPageIndex = 0;
  allEmpPageSize = 5;

  // Table columns for EarthFit style
  earthfitColumns: string[] = ['srNo', 'userId', 'name', 'userRole', 'gmail', 'status', 'action'];
  displayedColumns: string[] = ['sr', 'name', 'gmail', 'status', 'action'];

  // Make Math available in template
  Math = Math;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    public dialog: MatDialog,
    private route: Router,
    private snackBar: MatSnackBar,
    private businessData: BusinessDataService
  ) {}

  ngOnInit(): void {
    this.fetchPendingEmployees();
    this.fetchAllEmployees();
  }

  // Fetch Pending Employees
  fetchPendingEmployees() {
    this.businessData.getAllEmployees().subscribe({
      next: (res: any) => {
        const all = res.data || [];
        // ✅ Reset before filtering
        this.pendingEmployees = all.filter((e: any) => e.status === 'pending');
        this.pendingPageIndex = 0; // optional: reset pagination
        this.updatePaginatedEmployees();
      },
      error: (err) => {
        console.error('Error fetching employees:', err);
        this.showErrorMessage('Error fetching pending employees');
      }
    });
  }

  updatePaginatedEmployees() {
    const start = this.pendingPageIndex * this.pendingPageSize;
    const end = start + this.pendingPageSize;
    this.paginatedEmployees = this.pendingEmployees.slice(start, end);
  }

  pageChangePending(event: PageEvent) {
    this.pendingPageIndex = event.pageIndex;
    this.pendingPageSize = event.pageSize;
    this.updatePaginatedEmployees();
  }

  // Fetch All Employees
  fetchAllEmployees() {
    this.businessData.getAllEmployees().subscribe({
      next: (res: any) => {
        this.allEmployees = res.data || [];
        // Enhance employee data with default values for EarthFit design
        this.allEmployees = this.allEmployees.map((emp: any, index: number) => ({
          ...emp,
          userId: emp.userId || '101',
          role: emp.role || this.getRandomRole(),
          mobile: emp.mobile || '+91 9876543210'
        }));
        this.filteredAllEmployees = [...this.allEmployees];
        this.updatePaginatedAllEmployees();
      },
      error: (err) => {
        console.error('Error fetching all employees:', err);
        this.showErrorMessage('Error fetching all employees');
      }
    });
  }

  updatePaginatedAllEmployees() {
    const start = this.allEmpPageIndex * this.allEmpPageSize;
    const end = start + this.allEmpPageSize;
    this.paginatedAllEmployees = this.filteredAllEmployees.slice(start, end);
  }

  pageChangeAllEmp(event: PageEvent) {
    this.allEmpPageIndex = event.pageIndex;
    this.allEmpPageSize = event.pageSize;
    this.updatePaginatedAllEmployees();
  }

  // Search/Filter functionality
  applyAllEmployeeFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    
    if (!filterValue) {
      this.filteredAllEmployees = [...this.allEmployees];
    } else {
      this.filteredAllEmployees = this.allEmployees.filter(emp =>
        emp.name.toLowerCase().includes(filterValue) || 
        emp.gmail.toLowerCase().includes(filterValue)
      );
    }
    
    this.allEmpPageIndex = 0;
    this.updatePaginatedAllEmployees();
  }

  // Employee approval/rejection
  approveEmployee(gmail: string) {
    this.businessData.approveEmployeeByGmail(gmail).subscribe({
      next: () => {
        // Update pending employees list
        const pendingEmp = this.pendingEmployees.find(e => e.gmail === gmail);
        if (pendingEmp) {
          pendingEmp.status = 'approved';
        }

        // Update all employees list
        const allEmp = this.allEmployees.find(e => e.gmail === gmail);
        if (allEmp) {
          allEmp.status = 'approved';
        }

        // Update filtered list
        const filteredEmp = this.filteredAllEmployees.find(e => e.gmail === gmail);
        if (filteredEmp) {
          filteredEmp.status = 'approved';
        }

        this.updatePaginatedEmployees();
        this.updatePaginatedAllEmployees();
        this.showSuccessMessage('Employee approved successfully');
      },
      error: () => {
        this.showErrorMessage('Error approving employee');
      }
    });
  }

  rejectEmployee(gmail: string) {
    this.businessData.rejectEmployeeByGmail(gmail).subscribe({
      next: () => {
        // Update pending employees list
        const pendingEmp = this.pendingEmployees.find(e => e.gmail === gmail);
        if (pendingEmp) {
          pendingEmp.status = 'rejected';
        }

        // Update all employees list
        const allEmp = this.allEmployees.find(e => e.gmail === gmail);
        if (allEmp) {
          allEmp.status = 'rejected';
        }

        // Update filtered list
        const filteredEmp = this.filteredAllEmployees.find(e => e.gmail === gmail);
        if (filteredEmp) {
          filteredEmp.status = 'rejected';
        }

        this.updatePaginatedEmployees();
        this.updatePaginatedAllEmployees();
        this.showSuccessMessage('Employee rejected successfully');
      },
      error: () => {
        this.showErrorMessage('Error rejecting employee');
      }
    });
  }

  // Style helper methods for EarthFit design
  getRoleClass(role: string): string {
    switch (role) {
      case 'Role 1':
        return 'role-1';
      case 'Role 2':
        return 'role-2';
      case 'Role 3':
        return 'role-3';
      default:
        return 'role-1';
    }
  }

  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'approved':
        return 'active';
      case 'pending':
        return 'pending';
      case 'rejected':
        return 'rejected';
      default:
        return 'active';
    }
  }

  // Utility methods
  private getRandomRole(): string {
    const roles = ['Role 1', 'Role 2', 'Role 3'];
    return roles[Math.floor(Math.random() * roles.length)];
  }

  private showSuccessMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private showErrorMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['error-snackbar']
    });
  }

  // Navigation methods
  onProfile(): void {
    this.route.navigate(['profile']);
  }

  onLogout(): void {
    this.dialog.open(AlertBoxComponent, {
      data: { type: 'alert' }
    });
  }

  onLeaveApplication(): void {
    this.businessData.onNavigate('leave-management');
  }

  onEmpDashboard() {
    this.businessData.onNavigate('admin-dashboard');
  }

  onAdd() {
    this.businessData.onNavigate('home');
  }

  // New method for adding new user
  onNewUser(): void {
    // Add your new user logic here
    console.log('Add new user clicked');
    // Example: Open a dialog or navigate to add user page
    // this.route.navigate(['add-user']);
  }

  // Employee action methods
  onEditEmployee(employee: Employee): void {
    console.log('Edit employee:', employee);
    // Add your edit logic here
    // Example: Open edit dialog or navigate to edit page
  }

  onDeleteEmployee(employee: Employee): void {
    console.log('Delete employee:', employee);
    // Add your delete logic here
    // Example: Show confirmation dialog then delete
    const dialogRef = this.dialog.open(AlertBoxComponent, {
      data: { 
        type: 'confirm',
        message: `Are you sure you want to delete ${employee.name}?`
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Call delete API
        // this.businessData.deleteEmployee(employee.gmail).subscribe(...)
      }
    });
  }

  // Refresh data
  refreshData(): void {
    this.fetchPendingEmployees();
    this.fetchAllEmployees();
  }

  // Get total count methods for display
  getTotalPendingCount(): number {
    return this.pendingEmployees.length;
  }

  getTotalEmployeeCount(): number {
    return this.filteredAllEmployees.length;
  }

  // Export functionality (optional)
  exportToCSV(): void {
    console.log('Export to CSV clicked');
    // Add your export logic here
  }

  // Bulk operations (optional)
  onBulkApprove(): void {
    console.log('Bulk approve clicked');
    // Add your bulk approve logic here
  }

  onBulkReject(): void {
    console.log('Bulk reject clicked');
    // Add your bulk reject logic here
  }
}