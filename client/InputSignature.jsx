import './inputSignature.scss';
import React, { Component } from 'react';
import { func, object, string, bool } from 'prop-types';
import SignaturePad from 'react-signature-pad';

class InputSignature extends Component {
  static defaultProps = {
    labelDraw: 'Draw your signature in the box below!',
    labelType: 'Type your legal name into the field below to see your generated signature!',
    labelUpload: 'Upload a image of your signature!',
  }

  static propTypes = {
    onChange: func.isRequired,
    value: object,
    labelDraw: string,
    labelType: string,
    labelUpload: string,
    required: bool,
  };

  state = {
    selected: 'draw',
    textValue: '',
  };

  componentDidMount() {
    if ( this.props.value )
      this.updateSelected();
  }

  componentDidUpdate( prevProps ) {
    if ( prevProps.value !== this.props.value )
      if ( this.props.value )
        this.updateSelected();
  }

  updateSelected() {
    const { value } = this.props;

    if ( value.type === 'text' ) {
      this.setState({
        selected: 'text',
        textValue: value.data,
      });
    }
    else if ( value.type === 'draw' ) {
      this.setState({
        selected: 'draw',
      });

      this.signaturePad.fromDataURL( value.data );
    }
  }

  getOptions() {
    return [
      {
        id: 'draw',
        name: 'Draw',
        icon: 'gesture',
        instructions: this.props.labelDraw,
      },
      {
        id: 'text',
        name: 'Type',
        icon: 'text_fields',
        instructions: this.props.labelType,
      },
      {
        id: 'upload',
        name: 'Upload',
        icon: 'file_upload',
        instructions: this.props.labelUpload,
        disabled: true,
      },
    ];
  }

  handleClickOption = option => () => {
    this.setState({
      selected: option.id,
    });
  };

  handleSignatureChange = type => data => {
    this.props.onChange({ target: { value: { type, data } } });
  };

  handleClear = () => {
    this.signaturePad.clear();
  }

  onChange = event => {
    this.setState({
      textValue: event.target.value,
    });

    this.handleSignatureChange( 'text' )( event.target.value );
  }

  onDrawChange = () => {
    this.handleSignatureChange( 'draw' )( this.signaturePad.toDataURL());
  }

  render() {
    const { required } = this.props;
    const { selected, textValue } = this.state;
    const options = this.getOptions().filter( option => !option.disabled );
    const selectedOption = options.find( option => option.id === selected );

    return (
      <div className="input-signature">
        <div className="signature-type-selector">
          {options.map( option => (
            <div className={`signature-type-option ${selected === option.id ? 'selected' : ''}`} key={option.id} onClick={this.handleClickOption( option )}>
              <i className="material-icons">{option.icon}</i>
              <span>{option.name}</span>
            </div>
          ))}
        </div>

        <div className="signature-entry">
          <p className="signature-entry-instructions">{selectedOption.instructions}{required && <i>*</i>}</p>

          {( selected === 'draw' ) ? (
            <div className="signature-draw">
              <i className="material-icons" onClick={this.handleClear}>delete</i>
              <SignaturePad ref={ref => this.signaturePad = ref} onEnd={this.onDrawChange} />
            </div>
          ) : ( selected === 'text' ) ? (
            <div className="signature-type">
              <input type="text" placeholder="e.g. John Smith" value={textValue} onChange={this.onChange} />

              <br />

              <div className="signature-generated">
                <small>Generated Signature</small>
                <span>{textValue}</span>
              </div>
            </div>
          ) : (
            <div>Signature method not found</div>
          )}
        </div>
      </div>
    );
  }
}

export default InputSignature;
