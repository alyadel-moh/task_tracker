import { Model, DataTypes, Optional, Sequelize } from "sequelize";
import bcrypt from "bcryptjs";

export interface UserAttributes {
  id: string;
  name: string;
  email: string;
  photoUrl?: string | null;
  password?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserCreationAttributes extends Optional<
  UserAttributes,
  "id"
> {}

export class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  declare public id: string;
  declare public name: string;
  declare public email: string;
  declare public password: string;
  declare public photoUrl?: string | null;

  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;

  public async validPassword(candidatePassword: string): Promise<boolean> {
    if (!this.password) {
      throw new Error(
        "Password field is missing. Fetch user using the 'withPassword' scope.",
      );
    }
    return bcrypt.compare(candidatePassword, this.password);
  }
}

export default (sequelize: Sequelize): typeof User => {
  User.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.CITEXT,
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
      },
      photoUrl: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "photo_url",
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: "users",
      timestamps: true,
      underscored: true,
      defaultScope: {
        attributes: { exclude: ["password"] },
      },
      scopes: {
        withPassword: {
          attributes: { exclude: [] },
        },
      },
    },
  );

  return User;
};
