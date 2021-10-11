import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema} from '@ioc:Adonis/Core/Validator';
import Database from '@ioc:Adonis/Lucid/Database';
import { DateTime } from 'luxon';
import mDatatable from '../../Components/mDatatable';

export default class DatatablesController extends mDatatable {

	home( { view }: HttpContextContract){
		return view.render('home');
	}

	onetable( { view }: HttpContextContract){
		return view.render('onetable');
	}

	async view_data({ response, request }: HttpContextContract){
	    let tables: string = "artikel";
	    // let cari: Array<string> = ['judul'];
	    let cari: Array<string> = ['judul','kategori','penulis','tgl_posting'];
	    let isWhere: Array<string> | null = null;
	    // let isWhere = 'artikel.deleted_at IS NULL';
	    response.type('json');
	    // echo $this->M_Datatables->get_tables($tables,$search,$isWhere);
	    return await this.getTables({ tables,cari,isWhere, request, response});
	}

	async saveArtikel( { request, response }: HttpContextContract){
		const payloadData = await request.validate({
			schema: schema.create({
				judul: schema.string(),
				kategori: schema.string(),
				penulis: schema.string(),
				tgl_posting: schema.date.optional({
					format: 'yyyy-MM-dd HH:mm:ss',
				})
			}),
			messages: {
				'judul.required': "Judul Wajib Diisi",
				'kategori.required': "Kategori Wajib Diisi",
				'penulis.required': "Penulis Wajib Diisi",
			}
		});
		
		console.log(payloadData)

		const artikel = await Database.table('artikel').insert({
			judul: payloadData.judul,
			kategori: payloadData.kategori,
			penulis: payloadData.penulis,
			tgl_posting: DateTime.local().toFormat('yyyy-MM-dd HH:mm:ss')
		})
		
		if (artikel) {
			
			return response.status(200).json({
				statusCode: 200,
				message: 'Berhasl Disimpan'
			})
		} else {
			return response.status(400).json({
				statusCode: 400,
				message: 'Gagal Disimpan'
			})
		}
	}

	async deleteArtikel({ params,response }: HttpContextContract){
		const { id } = params
		await Database.from('artikel')
		.where('id_artikel', id)
		.delete()
		return response.status(200).json({
			statusCode: 200,
			message: 'Berhasl Dihapus'
		})
	}
}
