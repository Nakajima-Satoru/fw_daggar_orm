/**
 * ==================================================
 * 
 * ALBION_ORM Ver 1.0.0
 * 
 * base.js (OrmBase)
 * 
 * CopyLight: Nakajima-Satoru since 0201/04/16
 * 
 * ==================================================
 */

const ormConnection = require("./connection.js");
const sync = require("./sync.js");

const OrmBase = function(context){

    var connection = null;

    var log=[];
    
    /**
     * check
     * @returns 
     */
    this.check=function(){
        if(connection){
            return true;
        }
        else{
            return false;
        }
    };

    /**
     * query
     * @param {*} sql 
     * @param {*} bind 
     * @param {*} callback 
     * @param {*} option 
     */
    this.query=function(sql,bind,callback,option){

        if(!option){
            option={};
        }

        var _res={};
        
        sync([
            function(next){

                if(connection){
                    next();
                    return;
                }

                var sqlType=context.connection().type;
        
                connection = new ormConnection(context.connection(),function(obj){
                    if(sqlType=="mysql"){
                        next();
                    }
                    else if(sqlType=="sqlite3"){
                        connection=obj;
                        next();
                    }
               });
        
            },
            function(next){

                log.push({
                    sql:sql,
                    bind:bind,
                });

                if(connection.sqlType=="mysql"){

                    connection.query(sql,bind,function(error,result){

                        _res={
                            error:error,
                            result:result,
                        };

                        next();
                    });
        
                }
                else if(connection.sqlType=="sqlite3"){
        
                    connection.serialize(() => {
        
                        var sqlLower = sql.toLowerCase();
        
                        var methodType="";
                        if(sqlLower.indexOf("select")==0){
                            methodType="all";
                        }
                        if(option.methodType){
                            methodType=option.methodType;
                        }
        
                        if(methodType=="all"){
                            connection.all(sql,function(error,result){
                                _res={
                                    error:error,
                                    result:result,
                                };

                                next();
                            });
                        }
                        else if(methodType=="get"){
                            connection.get(sql,function(error,result){
                                _res={
                                    error:error,
                                    result:result,
                                };
        
                                next();
                            });
                        }
                        else if(methodType=="each"){
                            connection.each (sql,function(error,result){
                                _res={
                                    error:error,
                                    result:result,
                                };
        
                                next();
                            });
                        }
                        else{
                            connection.run(sql);
                            _res={
                                error:null,
                                result:true,
                            };
    
                            next();
                        }            
                    });
                }
        
            },
            function(){
                     
                var response = new OrmQueryResponse();

                if(_res.error){
                    response.status=false;
                    response.error=_res.error;
                }
                else{
                    response.status=true;
                    response.result=_res.result;
                }

                callback(response);
            },
        ]);

    };

    /**
     * checkSurrogateKey
     * @returns 
     */
    this.checkSurrogateKey=function(){
        
        if(!context.surrogateKey){
            return null;
        }

        return context.surrogateKey;
    };

    /**
     * getSqlType
     * @returns 
     */
    this.getSqlType=function(){
        return context.connection().type;
    };

    /**
     * getLog
     * @returns 
     */
    this.getLog=function(){
        return log;
    }
};

const OrmQueryResponse=function(){

    this.status=true;

};

module.exports=OrmBase;