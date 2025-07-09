import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/auth/auth.service';
import { BusinessDataService } from 'src/app/services/business-data.service';
import { AlertBoxComponent } from 'src/app/shared/alert-box/alert-box.component';
import { ProfileComponent } from 'src/app/shared/profile/profile.component';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  isLoading: boolean = true;
  app_version: any;
  userRole: string = '';

  constructor(
    private route: Router,
    public dialog: MatDialog,
    public authService: AuthService,
    public businessData: BusinessDataService
  ) {
    this.app_version = sessionStorage.getItem('Version');
  }

  ngOnInit(): void {
    this.userRole = localStorage.getItem('role') || '';

    this.isLoading = true;
    setTimeout(() => {
      this.isLoading = false;
    }, 4000);

     const token = localStorage.getItem('LEAD_ID');
    const userId = localStorage.getItem('Id');

    if (!token || !userId || userId.length !== 24) {
      this.authService.onLogout();
      return;
    }

    this.authService.authAfterReferesh(true, token); // ✅ safe use
  }

  openDialog(): void {
    this.dialog.open(ProfileComponent, {
      width: '100px',
    });
  }

  onView(): void {
    this.route.navigate(['dashboard']);
  }

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
    this.businessData.onNavigate('emp-dashboard');
  }

  onadminDashboard() {
    this.businessData.onNavigate('admin-dashboard');
  }

  onAdd() {
    this.businessData.onNavigate('home');
  }
}
