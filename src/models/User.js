import ClientError from "../exceptions/ClientError.js";
import InvariantError from "../exceptions/InvariantError.js";
import pool from "./db.js";
import bcrypt from "bcrypt";

class User {
  #client;
  #password;
  #encryptPassword;

  constructor({ id, username, password, createdAt, updatedAt } = {}) {
    this.id = id;
    this.username = username;
    this.#password = password;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;

    this.#encryptPassword = null;

    this.#client = undefined;
  }

  async save() {
    if (!this.#client) {
      this.#client = await pool.connect();
    }

    if (!this.#encryptPassword) await this.encryptPassword();

    const query = `INSERT INTO users (username, password) VALUES ($1, $2)`;
    const values = [this.username, this.#encryptPassword];
    await this.#client.query(query, values);
  }

  async isUsernameExist() {
    if (!this.#client) {
      this.#client = await pool.connect();
    }

    const query = `SELECT id FROM users WHERE username = $1`;
    const values = [this.username];
    const result = await this.#client.query(query, values);

    if (result.rows.length) throw new InvariantError("Username already exist");
  }

  async getByUsername(username) {
    if (!this.#client) {
      this.#client = await pool.connect();
    }

    const query = `SELECT id, username, password, created_at, updated_at FROM users WHERE username = $1`;
    const values = [username];
    const result = await this.#client.query(query, values);

    if (!result.rows.length) return null;

    const row = result.rows[0];

    this.id = row.id;
    this.username = row.username;
    this.#encryptPassword = row.password;
    this.createdAt = row.created_at;
    this.updatedAt = row.updated_at;

    return this
  }

  async encryptPassword() {
    this.#encryptPassword = await bcrypt.hash(this.#password, 10);
  }

  async comparePassword(password) {
    const result = await bcrypt.compare(password, this.#encryptPassword);
    if (!result) throw new ClientError("Password mismatch");
  }
}

export default User;
