import pool from "./db.js";
import DistanceObject from "./DistanceObject.js";

const distanceTransform = {
  objectSourceIndex: null,
  label: null,
  distanceTo: [],
};

class DistanceObjects {
  #client;

  /**
   * @param {string} predictionId
   * @param {Array<Object>} distanceEach
   * @returns {DistanceObjects}
   */
  transform(predictionId, distanceEachOthers = [distanceTransform]) {

    this.distanceObjects = [];

    distanceEachOthers.forEach((source, i) => {
      source.distanceTo.forEach((distance, j) => {
        const distanceObject = new DistanceObject({
          predictionId,
          objectSourceIndex: i,
          objectTargetIndex: j,
          distance: parseFloat(distance),
        });

        this.distanceObjects.push(distanceObject);
      });
    });

    return this;
  }

  async saveAll() {
    if (!this.#client) {
      this.#client = await pool.connect();
    }

    const colSize = 4;
    const valuesPlaceHolder = this.distanceObjects
      .map(
        (_, index) =>
          `($${index * colSize + 1}, $${index * colSize + 2}, $${
            index * colSize + 3
          }, $${index * colSize + 4})`
      )
      .join(", ");

    const query = `INSERT INTO distance_objects (prediction_id, object_source_index, object_target_index, distance) VALUES ${valuesPlaceHolder}`;

    const values = this.distanceObjects.reduce((acc, distanceObject) => {
      acc.push(distanceObject.predictionId);
      acc.push(distanceObject.objectSourceIndex);
      acc.push(distanceObject.objectTargetIndex);
      acc.push(distanceObject.distance);

      return acc;
    }, []);

    await this.#client.query(query, values);
    await this.#client.release();
  }

  async getAllByPredictionId(predictionId) {
    if (!this.#client) {
      this.#client = await pool.connect();
    }

    const query = `
      SELECT object_source_index, object_target_index, distance
      FROM distance_objects
      WHERE prediction_id = $1
    `;

    const result = await this.#client.query(query, [predictionId]);

    this.distanceObjects = result.rows.map(
      (row) =>
        new DistanceObject({
          objectSourceIndex: row.object_source_index,
          objectTargetIndex: row.object_target_index,
          distance: row.distance,
        })
    );

    await this.#client.release();
  }

  transformToArr2D() {
    const arr2D = [[]];

    for (let i = 0; i < this.distanceObjects.length; i++) {
      const tmp = this.distanceObjects[i];

      if (!arr2D[tmp.objectSourceIndex]) {
        arr2D[tmp.objectSourceIndex] = [];
      }

      arr2D[tmp.objectSourceIndex][tmp.objectTargetIndex] = tmp.distance;
    }

    return arr2D;
  }
}

export default DistanceObjects;
