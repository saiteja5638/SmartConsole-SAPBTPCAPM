service dataclassifer {


    type ClassificationResponse {
        Type        : String;
        Trend       : String;
        Seasonality : String;
    }
    
    action RunImport(SalesValue : array of Integer) returns ClassificationResponse;

    function insertSalesLog()                        returns String;
    function importintotable(tableName:String,salesData:String)                       returns String;

}
