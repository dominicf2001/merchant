import { DataStore, db } from "./DataStore";
import { Runs as Run } from "../schemas/public/Runs";
import { Kysely } from "kysely";
import Database from "../schemas/Database";

class Runs extends DataStore<Run, number> {
    constructor(db: Kysely<Database>) {
        super(db, "runs", "run_id");
    }
}

const runs = new Runs(db);
const MAIN_RUN_ID: number = 1;
export { runs as Runs, MAIN_RUN_ID };
