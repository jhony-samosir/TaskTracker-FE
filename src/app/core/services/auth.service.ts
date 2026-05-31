import { Injectable } from '@angular/core';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly STORAGE_KEY = 'tasktracker-user';

  currentUser(): User | null {
    const userJson = localStorage.getItem(this.STORAGE_KEY);
    return userJson ? JSON.parse(userJson) : null;
  }

  isAuthenticated(): boolean {
    return !!this.currentUser();
  }

  logout(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  // Mock login method for testing
  mockLogin(role: 'ADMIN' | 'EMPLOYEE' = 'ADMIN'): void {
    const user: User = {
      id: 1,
      name: role === 'ADMIN' ? 'Admin User' : 'Employee User',
      email: role === 'ADMIN' ? 'admin@tasktracker.com' : 'employee@tasktracker.com',
      role: role,
    };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
  }
}
