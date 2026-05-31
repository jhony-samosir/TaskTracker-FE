export interface MenuItem {
  label: string;
  icon: string;
  route: string;
  roles: Array<'ADMIN' | 'EMPLOYEE'>;
}
