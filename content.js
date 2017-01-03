import React from 'react';
import { render } from 'react-dom';
import './content.scss'

const HOMESSEARCHURL = 'https://address-search.homes.co.nz/typeahead/search'
const HOMESDETAILURL = 'https://spark-nz.cloud.tyk.io/homes/web/public/v1/properties'
const DELTA = 0.002;

const RELABSEARCHURL = 'https://spark-nz.cloud.tyk.io/relab/v1/findaddress16eedd2-3e948'
const RELABDETAILURL = 'https://spark-nz.cloud.tyk.io/relab/v1/finprepriceinfocache'

class Toolbar extends React.Component{
	constructor(props) {
		super(props);
		this.state = {
			address: null,
			evaluates: []
		}
	}

	getHomesPrice(address){
		fetch(HOMESSEARCHURL + "?Address="+encodeURIComponent(address.split('\n')[0])).then( (r) => {
			return r.json();
		}).then( (j) => {
			if(j.Results.length > 0){
				let lat = j.Results[0].Lat;
				let lng = j.Results[0].Long;
				let addr = j.Results[0].Title;
				let query = {};
				query.nw_lat = lat+DELTA;
				query.nw_lng = lng-DELTA;
				query.se_lat = lat-DELTA;
				query.se_lng = lng+DELTA;
				query.limit=1500
				query.off_market='true'
				let params = Object.keys(query)
		                   .map((key) => encodeURIComponent(key) + "=" + encodeURIComponent(query[key]))
		                   .join("&");

		        fetch(HOMESDETAILURL + "?" + params).then( (r) => {
		        	return r.json();
		        }).then( (j) => {
		        	let target = j.properties.filter(function(ele){
		        		return ele.address === addr;
		        	});
		        	if(target.length>0){
		        		this.setState(Object.assign({}, this.state, {
		        			evaluates: [...this.state.evaluates, {
			        			title: 'Homes',
			        			estimated_lower_value: target[0].estimated_lower_value,
			        			estimated_upper_value: target[0].estimated_upper_value,
			        			estimated_value: target[0].estimated_value,
			        			link: 'https://homes.co.nz/app/homes/properties/'+target[0].id,
			        			tags: ''
			        		}]
		        		}));
		        	}
		        })
			}
		});
	}

	getRelabPrice(address){
		fetch(RELABSEARCHURL + "?keyword="+encodeURIComponent(address.split('\n')[0])).then( (r) => {
			return r.json();
		}).then( (j) => {
			if(j.length > 0){
				let streetId = j[0].StreetId.split(':')[0]
				let displayName = j[0].DisplayAddress.replace(/[^\w\s]/gi, '');
				
		        fetch(RELABDETAILURL + "?streetId=" + streetId).then( (r) => {
		        	return r.json();
		        }).then( (j) => {
		        	let lower = j.ValueInfo.RangeEst.split('-')[0]
		        	let upper = j.ValueInfo.RangeEst.split('-')[1]
	        		this.setState(Object.assign({}, this.state, {
	        			evaluates: [...this.state.evaluates, {
		        			title: 'ReLab',
		        			estimated_lower_value: lower,
		        			estimated_upper_value: upper,
		        			estimated_value: j.ValueInfo.RangeValue,
		        			link: 'https://www.relab.co.nz/property/'+streetId+'/'+displayName,
		        			tags: j.TitleInfo.Titlehold + ' BuildAge:' + j.ValueInfo.BuildAge + ' Plaster:' + j.ValueInfo.IsPlaster
		        		}]
	        		}));
		        })
			}
		});
	}

	componentDidMount() {
		let addr = document.getElementById('ListingAttributes').children[0].children[0].children[1].innerText
		this.setState(Object.assign({}, this.state, {
			address: addr
		}));
		this.getHomesPrice(addr);
		this.getRelabPrice(addr);
	}

	render(ReactElement, DOMElement, callback){
		let evaluateComps = this.state.evaluates.map( (data, idx, self) => {
			return (
				<PricePanel key={'price-panel'+idx}
				title={data.title}
				estimatedLowerValue={data.estimated_lower_value}
				estimatedUpperValue={data.estimated_upper_value}
				estimatedValue={data.estimated_value}
				link={data.link}
				tags={data.tags}
				/>	
				)
		})

		return (
			<div className='tp-toolbar'>
				<h5>{this.state.address}</h5>
				<br/>
				{evaluateComps}
			</div>
			)
	}
}

class PricePanel extends React.Component {
	render(ReactElement, DOMElement, callback){
		return (
			<div className='price-panel'>
				<h5>{this.props.title}: ${this.props.estimatedValue}  <a target="_blank" href={this.props.link}>link</a></h5>
				<h6>{this.props.tags}</h6>
				${this.props.estimatedLowerValue} ~ ${this.props.estimatedUpperValue}
			</div>
			)
	}
}

let app = document.createElement('div')
app.className = 'tm-tool'
document.body.append(app)
render(<Toolbar/>, app);
