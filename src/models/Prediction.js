import pool from "./db.js";
import NotFoundError from './../exceptions/NotFoundError.js';

class Prediction {
  #client;

  /**
   * @param {Object} param0
   * @param {string} param0.id
   * @param {string} param0.uploadUrl
   * @param {string} param0.resultUrl
   * @param {Date} param0.createdAt
   * @param {Date} param0.updatedAt
   */
  constructor({ id, uploadUrl, resultUrl, createdAt, updatedAt } = {}) {
    this.id = id;
    this.uploadUrl = uploadUrl;
    this.resultUrl = resultUrl;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;

    this.#client = undefined;
  }

  /**
   * Save the detection to the database
   * @returns {Promise<void>}
   */
  async save() {
    if (!this.#client) {
      this.#client = await pool.connect();
    }

    const query = `INSERT INTO predictions (id, upload_url, result_url) VALUES ($1, $2, $3)`;
    const values = [this.id, this.uploadUrl, this.resultUrl];
    await this.#client.query(query, values);
  }

  /**
   * Update the detection in the database
   * @returns {Promise<Prediction[]>}
   */
  async getAll() {
    if (!this.#client) {
      this.#client = await pool.connect();
    }

    const query = `SELECT id, upload_url, result_url, created_at, updated_at FROM predictions`;
    const result = await this.#client.query(query);
    const predictions = result.rows.map(
      (row) =>
        new Prediction({
          id: row.id,
          uploadUrl: row.upload_url,
          resultUrl: row.result_url,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        })
    );

    return predictions;
  }

  /**
   * Get a detection by its id
   * @param {string} id
   * @returns {Promise<Prediction>}
   * @throws {Error} If the detection is not found
   */
  async getById(id) {
    if (!id) throw new Error("id is required");

    if (!this.#client) {
      this.#client = await pool.connect();
    }

    const query = `SELECT id, upload_url, result_url, created_at, updated_at FROM predictions WHERE id = $1`;
    const values = [id];
    const result = await this.#client.query(query, values);
    if (result.rows.length === 0) {
      throw new NotFoundError(`Prediction not found with id ${id}`);
    }

    const row = result.rows[0];
    
    this.id = row.id;
    this.uploadUrl = row.upload_url;
    this.resultUrl = row.result_url;
    this.createdAt = row.created_at;
    this.updatedAt = row.updated_at;

    return this;
  }

  /**
   * Delete a detection by its id
   * @param {string?} id If not provided, use the id of the current detection
   * @returns {Promise<void>}
   * @throws {Error} If the detection is not found
   */
  async delete(id) {
    if (!this.id) await this.getById(id);

    if (!this.#client) {
      this.#client = await pool.connect();
    }

    const query = `DELETE FROM predictions WHERE id = $1`;
    const values = [this.id];

    await this.#client.query(query, values);

    this.id = undefined;
    this.uploadUrl = undefined;
    this.resultUrl = undefined;
    this.createdAt = undefined;
    this.updatedAt = undefined;

    return this;
  }
}

export default Prediction;
