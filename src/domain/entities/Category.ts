export interface CategoryProps {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  parentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Category {
  private props: CategoryProps;

  constructor(props: CategoryProps) {
    this.props = props;
  }

  get id() { return this.props.id; }
  get name() { return this.props.name; }
  get slug() { return this.props.slug; }
  get description() { return this.props.description; }
  get imageUrl() { return this.props.imageUrl; }
  get parentId() { return this.props.parentId; }
  get createdAt() { return this.props.createdAt; }
  get updatedAt() { return this.props.updatedAt; }

  update(name: string, description?: string, imageUrl?: string): void {
    this.props.name = name;
    this.props.slug = name.toLowerCase().replace(/\s+/g, '-');
    if (description !== undefined) this.props.description = description;
    if (imageUrl !== undefined) this.props.imageUrl = imageUrl;
    this.props.updatedAt = new Date();
  }

  toJSON() {
    return { ...this.props };
  }
}
