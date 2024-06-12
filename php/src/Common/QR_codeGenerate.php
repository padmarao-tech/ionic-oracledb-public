<?php

namespace FL\Common;

use chillerlan\QRCode\QRCode;
use chillerlan\QRCode\QROptions;

class QR_codeGenerate
{
    public $options;
    function __construct()
    {
        $this->options = new QROptions(
            [
                'eccLevel' => QRCode::ECC_L,
                'outputType' => QRCode::OUTPUT_MARKUP_SVG,
                'version' => 5,
            ]
        );
    }

    function GenerateQR($data){
        $data = json_encode($data);
        $data = str_replace("\/","/",$data);
        $qrcode = (new QRCode($this->options))->render($data);

        return $qrcode;
    }
}
