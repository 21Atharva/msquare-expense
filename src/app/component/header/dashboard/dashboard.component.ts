import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ProfileComponent } from 'src/app/shared/profile/profile.component';
import { BusinessDataService } from 'src/app/services/business-data.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  keywords: any = [];
  constructor(
    private route: Router,
    public dialog: MatDialog,
    private businessData: BusinessDataService
  ) {}
  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.businessData.onGetAllCategory().subscribe((res: any) => {
      this.keywords = res.data;
    });
  }
  handleCategory(event:any){
    // Reload categories when a new category is added
    this.loadCategories();
  }

  openDialog(): void {
    this.dialog.open(ProfileComponent, {
      width: '600px',
    });
  }

  onView() {
    this.route.navigate(['dashboard']);
  }
}
