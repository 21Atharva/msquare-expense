import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { LayoutConfig, NavigationItem } from './layout.interface';

@Component({
  selector: 'app-shared-layout',
  templateUrl: './shared-layout.component.html',
  styleUrls: ['./shared-layout.component.scss']
})
export class SharedLayoutComponent implements OnInit, OnChanges {
  @Input() config!: LayoutConfig;
  @Output() logoutEvent = new EventEmitter<void>();

  filteredNavigationItems: NavigationItem[] = [];

  ngOnInit() {
    this.filterNavigationItems();
  }

  ngOnChanges() {
    this.filterNavigationItems();
  }

  private filterNavigationItems() {
    if (!this.config?.navigationItems) {
      this.filteredNavigationItems = [];
      return;
    }

    this.filteredNavigationItems = this.config.navigationItems.filter(item => {
      // If no roles specified, show to all
      if (!item.roles || item.roles.length === 0) {
        return true;
      }
      
      // If user role is specified, check if it's in the allowed roles
      if (this.config.userRole) {
        return item.roles.includes(this.config.userRole);
      }
      
      return true;
    });
  }

  onLogout() {
    this.logoutEvent.emit();
  }
} 
