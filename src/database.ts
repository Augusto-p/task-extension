import sqlite3 from 'sqlite3';


export class LocalDatabase {
  private _DataBase;
  constructor(
    private readonly _DataBaseFile: string,
  ) {

    this._DataBase = new sqlite3.Database(this._DataBaseFile);
  }

  public CreateDBStruct() {
    // Create a table

    this._DataBase.serialize(() => {
      this._DataBase.run(`CREATE TABLE Tarea (
			ID         INTEGER     PRIMARY KEY 
								   NOT NULL,
			Texto      TEXT        NOT NULL,
			Fecha      NUMERIC     NOT NULL,
			Completada INTEGER (2) NOT NULL
		);`);

      this._DataBase.run(`CREATE TABLE Estado (
        Tarea              REFERENCES Tarea (ID) ON DELETE CASCADE ON UPDATE CASCADE NOT NULL,
        Fecha              NUMERIC NOT NULL,
        Estado             INTEGER NOT NULL,
        PRIMARY KEY (Tarea, Fecha)
    );`);

      this._DataBase.run(`CREATE TRIGGER actualizar_completada
    AFTER INSERT ON Estado
    BEGIN
        UPDATE Tarea
        SET Completada = NEW.Estado
        WHERE ID = NEW.Tarea;
    END;`)
    });
  }

  private async _GetNextIdInter() {
    return new Promise((resolve, reject) => {
      this._DataBase.get("select id from Tarea ORDER BY id DESC limit 1", (err, row) => {
        if (err) reject(err);
        if (!row) {
          resolve(undefined);
        }else{
          resolve(row);

        }
      });
    });

  }

  public async _GetNextId() {
    let Res = await this._GetNextIdInter()
    if (Res !== undefined && Res !== null && !(typeof Res === 'object' && Res.constructor === Object)) {
      return (Res as { ID: number }).ID + 1;
  }
    return 1;
    

  }

  public async _CrearTarea(id: number, Text: string, satus: boolean) {
    this._DataBase.run(`INSERT INTO Tarea (Completada,Fecha,Texto,ID)VALUES (?,?,?,?);`,
      [booleanToTinyInt(satus), getDateUTCPosix(), Text, id])
  }

  public async _NewEstado(id: number, satus: boolean) {
    console.log(booleanToTinyInt(satus));
    
    this._DataBase.run(`INSERT INTO Estado (Estado,Fecha,Tarea) VALUES (?,?,?);`, 
                        [booleanToTinyInt(satus), getDateUTCPosix(), id])
  }

  public async _UpdateText(id:number, Text:string){
    this._DataBase.run(`UPDATE Tarea
    SET Texto = ?       
  WHERE ID = ?;`,[Text, id])
  }

  private async GetAllTaskInter() {
    return new Promise((resolve, reject) => {
      this._DataBase.all("SELECT t.id, t.Texto, COALESCE(e.Fecha, t.Fecha) AS Fecha,COALESCE(e.estado, 0) AS completado FROM tarea t LEFT JOIN (SELECT tarea, estado, fecha FROM estado e1 WHERE fecha = (SELECT MAX(fecha) FROM estado e2 WHERE e1.tarea = e2.tarea)) e ON t.id = e.tarea;", (err, row) => {
        if (err) reject(err); // I assume this is how an error is thrown with your db callback
        resolve(row);
      });
    });

  }

  public async _GetAllTask() {
    let Res = await this.GetAllTaskInter()
    if (Res == undefined) {
      return [];

    } else
      return Res
      

  }

  public async _deleteTask(id:number){
    this._DataBase.run(`DELETE FROM Tarea WHERE ID = ?`,[id])
  }


}


function getDateUTCPosix() {
  return new Date().toISOString();
}

function booleanToTinyInt(value: boolean) {
  if (value) {
    return 1;
  }
  return 0;
}