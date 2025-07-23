import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { BusinessDataService } from 'src/app/services/business-data.service';
import { MatChipInputEvent } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-add-category',
  templateUrl: './add-category.component.html',
  styleUrls: ['./add-category.component.scss']
})
export class AddCategoryComponent implements OnInit {
  @Output() categoryAdded = new EventEmitter<string[]>();
  keywords: string[] = [];
  originalKeywords: string[] = []; // Track original categories
  CategoryLoad: boolean = true;
  isSaving: boolean = false;
  isEdit: boolean = false;

  constructor(
    public businesData: BusinessDataService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.onGetCategory();
  }

  onGetCategory() {
    this.CategoryLoad = true;
    this.isSaving = false;
    this.businesData.onGetAllCategory().subscribe((res: any) => {
      if (res) {
        this.CategoryLoad = false;
        this.keywords = [...res.data]; // Create a copy
        this.originalKeywords = [...res.data]; // Store original for comparison
      }
    });
  }

  add(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value) {
      if (this.keywords.includes(value)) {
        this.snackBar.open(`Category "${value}" already exists!`, 'Close', { duration: 3000 });
      } else {
        this.keywords.push(value);
        this.snackBar.open(`Category "${value}" added!`, '', { duration: 2000 });
      }
    }
    event.chipInput!.clear();
  }

  removeKeyword(keyword: string): void {
    const index = this.keywords.indexOf(keyword);
    if (index >= 0) {
      if (this.isEdit && index < 4) return; // Restrict first 4 during edit
      this.keywords.splice(index, 1);
    }
  }

  onSave(): void {
    // Find only new categories that weren't in the original list
    const newCategories = this.keywords.filter(category => 
      !this.originalKeywords.includes(category)
    );

    if (newCategories.length === 0) {
      this.snackBar.open('No new categories to add!', 'Close', { duration: 3000 });
      return;
    }

    this.isSaving = true;
    this.businesData.onCreateCategory(newCategories).subscribe((res) => {
      if (res) {
        this.isSaving = false;
        this.categoryAdded.emit(this.keywords);
        this.snackBar.open(`${newCategories.length} new categories saved successfully!`, '', { duration: 3000 });
        this.onGetCategory(); // Refresh the list
      }
    }, (error) => {
      this.isSaving = false;
      this.snackBar.open('Error saving categories. Please try again.', 'Close', { duration: 4000 });
    });
  }

  onSaveEditCategories(): void {
    this.isSaving = true;
    this.businesData.onEditCategory(this.keywords).subscribe((res) => {
      if (res) {
        this.isSaving = false;
        this.isEdit = false;
        this.categoryAdded.emit(this.keywords);
        this.onGetCategory();
      }
    });
  }

  onReset(): void {
    this.keywords = [...this.originalKeywords]; // Reset to original categories
    this.isEdit = false;
  }

  onEditCategories(): void {
    this.isEdit = !this.isEdit;
  }
}
