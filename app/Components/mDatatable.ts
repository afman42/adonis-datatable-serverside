import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'

interface getTable {
  tables: string;
  cari: Array<string>;
  isWhere: Array<string> | null,
  request: HttpContextContract['request'];
  response: HttpContextContract['response'];
}

export default class mDatatable {

  async getTables({ tables, cari, isWhere, request,response }: getTable) {

    let requestDraw = request.input('draw');

    let requestSearch = request.input('search.value');

    let search = this.escapeHtml(requestSearch)

    let requestLength = request.input('length')
    let requestStart = request.input('start')

    let limit = parseInt(requestLength.replace('("/[^a-zA-Z0-9.]/', ''))
    let start = parseInt(requestStart.replace('("/[^a-zA-Z0-9.]/', ''))

    let query = tables;
    let sqlIsWhereCount, sqlCounts;
    if (isWhere != null) {
      sqlIsWhereCount = await Database.query().from(query).whereRaw('?? = ?', [isWhere[0], isWhere[1]]).count('* as total');
    } else {
      sqlCounts = await Database.query().from(query).count('* as total');;
    }

    let sqlCount = isWhere != null ? sqlIsWhereCount : sqlCounts;
    
    // let cariSearch = " judul LIKE '%" + search + "%' OR " + "judul  LIKE '%" + search + "%'";
    let cariSearch = cari.join(" LIKE '%" + search + "%' OR " ) + "  LIKE '%" + search + "%'";
    // $cari = implode(" LIKE '%".$search."%' OR ", $cari)." LIKE '%".$search."%'";

    let requestOrderField = request.input('order.0.column');
    // Untuk mengambil nama field yg menjadi acuan untuk sorting

    // Untuk menentukan order by "ASC" atau "DESC"
    let requestAscdesc = request.input('order.0.dir');
    let requestOrder =  request.input(`columns.${requestOrderField}.data`);
    // $order = " ORDER BY ".$_POST['columns'][$order_field]['data']." ".$order_ascdesc;
    
    let sqlData;
    if (isWhere != null) {
      sqlData = await Database.rawQuery(`SELECT * FROM :query: WHERE :iswhere1: = :iswhere2: AND (${cariSearch}) ORDER BY ${requestOrder} ${requestAscdesc} LIMIT :limit OFFSET :start`,
        {
          query,
          iswhere1: isWhere[0],
          iswhere2: isWhere[1],
          limit,
          start
        });
    }else {
      sqlData = await Database.rawQuery(`SELECT * FROM :query: WHERE (${cariSearch}) ORDER BY ${requestOrder} ${requestAscdesc}  LIMIT :limit OFFSET :start`,{
        query,
        limit,
        start
      })
    }

    let sqlCari;
    let sqlFilterCount;
    if (search != "") {
       if (isWhere != null) {
        sqlCari = await Database.query().from(query).whereRaw('?? = ?', [isWhere[0], isWhere[1]]).whereRaw('( ? )',[cariSearch]).count('* as Filtertotal')
      } else {
        sqlCari = await Database.query().from(query).whereRaw('( ? )', [cariSearch]).count('* as Filtertotal')
      }
      sqlFilterCount = sqlCari;
    } else {
      if (isWhere != null) {     
        sqlCari = await Database.query().from(query).whereRaw('?? = ?', [isWhere[0], isWhere[1]]).count('* as Filtertotal');
      } else {
        sqlCari = await Database.query().from(query).count('* as Filtertotal');
      }
      sqlFilterCount = sqlCari
    }

    let data = sqlData[0];
    // console.log(data[0]);
    let callback = {
      'draw': requestDraw, // Ini dari datatablenya    
      'recordsTotal': sqlCount[0].total,
      'recordsFiltered': sqlFilterCount[0].Filtertotal,
      'data': data
    };

    return response.json(callback)
  }

  escapeHtml(text) {
    var map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };

    return text.replace(/[&<>"']/g, function (m) { return map[m]; });
  }
}