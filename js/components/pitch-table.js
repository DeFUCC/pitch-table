import {sqnob} from '../sqnob.js'
import Synth from '../Synth.js'

const noteCell = {
	template:`
	<td	class="note-button"
				:style="{backgroundColor:color, color:textColor}"
				@click="toggle()"
				:class="{'active-cell':active}"
				>
		<div class="note-grid">

			<div class="begin">
				{{note.name}}<br />{{octave}}
			</div>
			<div class="note-freq">
				{{frequency}}&nbsp;Hz
			</div>
			<div class="note-freq">
				{{bpm}}&nbsp;BPM
			</div>

		</div>

	</td>
	`,
	props:['note','octave','root', 'tuning','type','filter'],
	data() {
		return {
			active:false,
			started:false,
			justCents:[0,112,204,316,386,498,590,702,814,884,1017,1088],
		}
	},
	computed: {
		frequency() {
			return this.calcFreq(this.note.pitch, this.octave)
		},
		bpm() {
			return (this.frequency*60).toFixed(1)
		},
		textColor() {
			if (Math.abs(this.octave+2)*8>40) {
				return 'hsla(0,0%,0%,'+(this.active  ? '1' : '0.8')+')'
			} else {
				return 'hsla(0,0%,1000%,'+(this.active  ? '1' : '0.8')+')'
			}
		},
		color() {
			return 'hsla('+this.note.pitch*30+','+ (this.active  ? '100' : '75') +'%,'+Math.abs(this.octave+2)*8+'%)'
		}
	},
	watch: {
		root() {
			this.refresh()
		},
		tuning() {
			this.refresh()
		},
		type(val) {
			if(this.osc) {
				this.osc.type=val;
			}
		}
	},
	methods:{
		refresh() {
			if(this.osc) {
				this.osc.frequency.setValueAtTime(this.calcFreq(this.note.pitch, this.octave),Tone.context.currentTime)
			}
		},
		toggle() {
			if(!this.active) {
				if(Tone.context.state=='suspended') {Tone.context.resume()}

					this.osc = Tone.context.createOscillator();
					this.osc.type=this.type;
					this.osc.frequency.value=this.frequency;

					this.osc.connect(this.filter.input);
					this.osc.start();
					this.started=true;

				this.active=true;
			} else {
				this.active=false;
				this.osc.stop();
				this.osc.disconnect();
			}
		},
		calcFreq(pitch, octave=3, root=this.root) {
			let hz=0;
			if (this.tuning=='equal') {
				hz = Number(root * Math.pow(2, octave - 4 + pitch / 12)).toFixed(2)
			}
			if(this.tuning=='just') {
				let diff = Number(Math.pow((Math.pow(2,1/1200)),this.justCents[pitch]));
				hz = Number(root*Math.pow(2,(octave-4))*diff).toFixed(2)

			}
			 return hz
		},
	}
}

export const pitchTable = {
	components: {
		'note-cell':noteCell,
		sqnob
	},
	template: `  <div id="pitch-table">

	<div class="control-row">
	<div>
		<h3>Intonation</h3>
		<b-field grouped group-multiline  >

			<b-radio-button  size="is-small" native-value="equal" v-model="tuning" >EQUAL</b-radio-button>
			<b-radio-button  size="is-small" native-value="just" v-model="tuning">JUST</b-radio-button>
		</b-field>
	</div>
	<div>
		<h3>Oscillator type</h3>
		<b-field grouped group-multiline>
			<b-radio-button :key="type"  size="is-small" v-for="type in oscTypes"
				:native-value="type" v-model="oscType">{{type}}</b-radio-button>
		</b-field>
	</div>
	<div>
		<b-field label="Low Pass">
			<sqnob v-model="filterFreq" unit=" Hz" param="LP FILTER" :step="1" :min="20" :max="25000"></sqnob>
		</b-field>
	</div>

	<div>
		<b-field label="A4">
			<sqnob v-model="rootFreq" unit=" Hz" param="FREQUENCY" :step="1" :min="415" :max="500"></sqnob>
		</b-field>
	</div>


	</div>

		<div class="table-holder">
			<table class="pitch-table">
				<tr v-for="note in reversedNotes" class="note-block" >
					<td is="note-cell" v-for="octave in octaves" :key="octave" :root="rootFreq" :note="note" :octave="octave" :tuning="tuning" :filter="filter" :type="oscType"></td>
				</tr>
			</table>
		</div>
	</div>`,
	data() {
    return {
      notes:[
						  {
						    name: "A",
						    pitch: 0,
						  },
						  {
						    name: "A#",
						    pitch: 1,
						  },
						  {
						    name: "B",
						    pitch: 2,
						  },
						  {
						    name: "C",
						    pitch: 3,
						  },
						  {
						    name: "C#",
						    pitch: 4,
						  },
						  {
						    name: "D",
						    pitch: 5,
						  },
						  {
						    name: "D#",
						    pitch: 6,
						  },
						  {
						    name: "E",
						    pitch: 7,
						  },
						  {
						    name: "F",
						    pitch: 8,
						  },
						  {
						    name: "F#",
						    pitch: 9,
						  },
						  {
						    name: "G",
						    pitch: 10,
						  },
						  {
						    name: "G#",
						    pitch: 11
						  }
			],
      octaveRange:[-6,9],
      frequency:1,
      oscType:'sawtooth',
      oscTypes:['sine','triangle','sawtooth','square'],
      tuning:'equal',
      sound:false,
      started:false,
      rootFreq:440,
			filterFreq: 350,
      osc:'',
			filter: new Tone.AutoFilter()
	  }
  },
	computed: {
		reversedNotes() {
			let notes=[...this.notes]
			return notes.reverse();
		},
		octaves() {
			let octaves=[];
			for(let i=this.octaveRange[0];i<=this.octaveRange[1];i++) {
				octaves.push(i)
			}
			return octaves
		}
	},
	methods: {

	},
	watch: {
		frequency() {
			this.osc && this.osc.frequency.setValueAtTime(this.frequency,Tone.context.currentTime)
		},
		filterFreq (val) {
			this.filter.filter.frequency.setValueAtTime(val);
		}
	},
	mounted() {
    this.filter.connect(Synth.volume);
  },
  beforeDestroy() {
		this.filter.disconnect();
	}
}
