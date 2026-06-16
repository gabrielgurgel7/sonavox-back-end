import { Role } from '../../shared/types';

export interface UserProps {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  avatarUrl?: string;
  stripeCustomerId?: string;
  refreshToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  private props: UserProps;

  constructor(props: UserProps) {
    this.props = props;
  }

  get id() { return this.props.id; }
  get name() { return this.props.name; }
  get email() { return this.props.email; }
  get password() { return this.props.password; }
  get role() { return this.props.role; }
  get avatarUrl() { return this.props.avatarUrl; }
  get stripeCustomerId() { return this.props.stripeCustomerId; }
  get refreshToken() { return this.props.refreshToken; }
  get createdAt() { return this.props.createdAt; }
  get updatedAt() { return this.props.updatedAt; }

  isAdmin(): boolean {
    return this.props.role === 'ADMIN';
  }

  updateProfile(name: string, avatarUrl?: string): void {
    this.props.name = name;
    if (avatarUrl) this.props.avatarUrl = avatarUrl;
    this.props.updatedAt = new Date();
  }

  setStripeCustomerId(customerId: string): void {
    this.props.stripeCustomerId = customerId;
    this.props.updatedAt = new Date();
  }

  setRefreshToken(token: string | undefined): void {
    this.props.refreshToken = token;
    this.props.updatedAt = new Date();
  }

  toJSON() {
    return {
      id: this.props.id,
      name: this.props.name,
      email: this.props.email,
      role: this.props.role,
      avatarUrl: this.props.avatarUrl,
      stripeCustomerId: this.props.stripeCustomerId,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }
}
